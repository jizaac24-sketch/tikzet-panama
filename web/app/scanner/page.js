'use client';
import { useState, useEffect, useRef } from 'react';

export default function Scanner() {
  const [logueado, setLogueado] = useState(false);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resultado, setResultado] = useState(null);
  const [escaneando, setEscaneando] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  async function login(e) {
    e.preventDefault();
    const res = await fetch('http://192.168.100.141:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (json.token) { setToken(json.token); setLogueado(true); }
    else alert(json.error);
  }

  async function iniciarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setEscaneando(true);
    } catch (err) {
      alert('Error al acceder a la cámara: ' + err.message + '. Asegúrate de usar HTTPS o localhost.');
    }
  }

  useEffect(() => {
    if (!escaneando) return;
    const jsQR = require('jsqr');
    const intervalo = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height);
      if (code) {
        clearInterval(intervalo);
        validarQR(code.data);
      }
    }, 500);
    return () => clearInterval(intervalo);
  }, [escaneando]);

  async function validarQR(data) {
    setEscaneando(false);
    const res = await fetch('http://192.168.100.141:3001/api/scanner/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ qrData: data })
    });
    const json = await res.json();
    setResultado(json);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-purple-400 mb-6">Tikzet Escáner</h1>

      {!logueado && (
        <form onSubmit={login} className="bg-gray-900 p-6 rounded-xl w-full max-w-sm flex flex-col gap-3">
          <p className="text-gray-400 text-center">Inicia sesión para escanear</p>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className="p-2 rounded bg-gray-800" required />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Contraseña" className="p-2 rounded bg-gray-800" required />
          <button className="bg-purple-600 p-2 rounded font-bold hover:bg-purple-700">Entrar</button>
        </form>
      )}

      {logueado && !escaneando && !resultado && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-green-400">Sesión iniciada</p>
          <button onClick={iniciarCamara} className="bg-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-700">
            Abrir cámara y escanear
          </button>
        </div>
      )}

      {escaneando && (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <p className="text-gray-400">Apunta al código QR...</p>
          <video ref={videoRef} className="w-full rounded-xl" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {resultado && (
        <div className={`p-6 rounded-xl w-full max-w-sm text-center ${resultado.valido ? 'bg-green-900' : 'bg-red-900'}`}>
          <p className="text-2xl font-bold mb-2">{resultado.valido ? '✓ ACCESO PERMITIDO' : '✗ ACCESO DENEGADO'}</p>
          <p>{resultado.mensaje}</p>
          {resultado.ticket && <p className="mt-2 text-gray-300">{resultado.ticket.nombreComprador}</p>}
          <button onClick={() => { setResultado(null); iniciarCamara(); }} className="mt-4 bg-purple-600 px-4 py-2 rounded hover:bg-purple-700">
            Escanear otro
          </button>
        </div>
      )}
    </main>
  );
}