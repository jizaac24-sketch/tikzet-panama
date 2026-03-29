const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const supabase = require('../supabase');

router.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });

  const { data: existe } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single();

  if (existe) return res.status(400).json({ error: 'Email ya registrado' });

  const hash = await bcrypt.hash(password, 10);

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .insert({ nombre, email, password: hash })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const token = jwt.sign({ id: usuario.id, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  res.status(201).json({ token, usuario: { id: usuario.id, nombre, email } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();

  if (!usuario || !(await bcrypt.compare(password, usuario.password)))
    return res.status(400).json({ error: 'Credenciales incorrectas' });

  const token = jwt.sign({ id: usuario.id, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email } });
});

module.exports = router;