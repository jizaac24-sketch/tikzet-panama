'use client';
import { useState } from 'react';

export default function Home() {
  const [vista, setVista] = useState('inicio');
  const [token, setToken] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [eventos, setEventos] = useState([]);
  const [modo, setModo] = useState('registro');

  async function registrar(e) {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.target));
    const res = await fetch('http://localhost:3001/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const json = await res.json();
    if (json.token) { setToken(json.token); setVista('dashboard'); setMensaje('Bienvenido ' + json.usuario.nombre); }
    else setMensaje(json.error);
  }

  async function login(e) {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.target));
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const json = await res.json();
    if (json.token) { setToken(json.token); setVista('dashboard'); setMensaje('Bienvenido ' + json.usuario.nombre); }
    else setMensaje(json.error);
  }

  async function crearEvento(e) {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.target));
    const res = await fetch('http://localhost:3001/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(datos)
    });
    const json = await res.json();
    if (json.id) setMensaje('Evento creado: ' + json.nombre);
    else setMensaje(json.error);
  }

  async function verEventos() {
    const res = await fetch('http://localhost:3001/api/events');
    const json = await res.json();
    setEventos(Array.isArray(json) ? json : []);
    setVista('eventos');
  }

  async function comprarEntrada(eventoId) {
    const nombre = prompt('Tu nombre:');
    const email = prompt('Tu email:');
    const res = await fetch('http://localhost:3001/api/tickets/comprar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventoId, nombreComprador: nombre, emailComprador: email })
    });
    const json = await res.json();
    if (json.ticket) {
      const img = document.createElement('img');
      img.src = json.ticket.qrImagen;
      img.style = 'width:200px';
      document.getElementById('qr-zona').innerHTML = '';
      document.getElementById('qr-zona').appendChild(img);
      setMensaje('Entrada comprada para ' + nombre);
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 p-6">
      <h1 className="text-3xl font-bold text-center mb-6 text-black">Westford Ticket</h1>

      {mensaje && <p className="text-center text-gray-600 mb-4">{mensaje}</p>}

      {vista === 'inicio' && (
        <div className="max-w-md mx-auto bg-gray-100 p-6 rounded-xl border border-gray-200">
          <div className="flex mb-6">
            <button onClick={() => setModo('registro')} className={`flex-1 p-2 rounded-l font-bold ${modo === 'registro' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}>Registro</button>
            <button onClick={() => setModo('login')} className={`flex-1 p-2 rounded-r font-bold ${modo === 'login' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}>Iniciar sesión</button>
          </div>

          {modo === 'registro' && (
            <form onSubmit={registrar} className="flex flex-col gap-3">
              <input name="nombre" placeholder="Nombre" className="p-2 rounded border border-gray-300 bg-white text-gray-900" required />
              <input name="email" type="email" placeholder="Email" className="p-2 rounded border border-gray-300 bg-white text-gray-900" required />
              <input name="password" type="password" placeholder="Contraseña" className="p-2 rounded border border-gray-300 bg-white text-gray-900" required />
              <button className="bg-black text-white p-2 rounded font-bold hover:bg-gray-800">Registrarse</button>
            </form>
          )}

          {modo === 'login' && (
            <form onSubmit={login} className="flex flex-col gap-3">
              <input name="email" type="email" placeholder="Email" className="p-2 rounded border border-gray-300 bg-white text-gray-900" required />
              <input name="password" type="password" placeholder="Contraseña" className="p-2 rounded border border-gray-300 bg-white text-gray-900" required />
              <button className="bg-black text-white p-2 rounded font-bold hover:bg-gray-800">Iniciar sesión</button>
            </form>
          )}
        </div>
      )}

      {vista === 'dashboard' && (
        <div className="max-w-md mx-auto flex flex-col gap-4">
          <div className="bg-gray-100 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-black">Crear evento</h2>
            <form onSubmit={crearEvento} className="flex flex-col gap-3">
              <input name="nombre" placeholder="Nombre del evento" className="p-2 rounded border border-gray-300 bg-white text-gray-900" required />
              <input name="fecha" type="datetime-local" className="p-2 rounded border border-gray-300 bg-white text-gray-900" required />
              <input name="lugar" placeholder="Lugar" className="p-2 rounded border border-gray-300 bg-white text-gray-900" required />
              <input name="precio" type="number" placeholder="Precio (USD)" className="p-2 rounded border border-gray-300 bg-white text-gray-900" required />
              <input name="capacidad" type="number" placeholder="Capacidad" className="p-2 rounded border border-gray-300 bg-white text-gray-900" />
              <button className="bg-black text-white p-2 rounded font-bold hover:bg-gray-800">Crear evento</button>
            </form>
          </div>
          <button onClick={verEventos} className="bg-gray-200 text-gray-900 p-3 rounded-xl font-bold hover:bg-gray-300">Ver eventos publicados</button>
          <button onClick={() => { setToken(''); setVista('inicio'); setMensaje(''); }} className="text-gray-500 hover:underline text-sm">Cerrar sesión</button>
        </div>
      )}

      {vista === 'eventos' && (
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setVista('dashboard')} className="mb-4 text-gray-600 hover:underline">← Volver</button>
          <h2 className="text-xl font-bold mb-4 text-black">Eventos disponibles</h2>
          {eventos.length === 0 && <p className="text-gray-500">No hay eventos publicados aún.</p>}
          {eventos.map(ev => (
            <div key={ev.id} className="bg-gray-100 p-4 rounded-xl mb-3 border border-gray-200">
              <h3 className="font-bold text-lg text-black">{ev.nombre}</h3>
              <p className="text-gray-500">{ev.lugar} — {new Date(ev.fecha).toLocaleDateString()}</p>
              <p className="text-gray-800 font-bold">${ev.precio}</p>
              <button onClick={() => comprarEntrada(ev.id)} className="mt-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800">Comprar entrada</button>
            </div>
          ))}
          <div id="qr-zona" className="mt-6 flex justify-center"></div>
        </div>
      )}
    </main>
  );
}