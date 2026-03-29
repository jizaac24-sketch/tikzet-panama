const express  = require('express');
const router   = express.Router();
const authMidd = require('../middleware/auth');
const supabase = require('../supabase');

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('publicado', true);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json(data);
});

router.post('/', authMidd, async (req, res) => {
  const { nombre, fecha, lugar, descripcion, precio, capacidad } = req.body;
  if (!nombre || !fecha || !lugar || !precio)
    return res.status(400).json({ error: 'Faltan datos del evento' });

  const { data, error } = await supabase
    .from('eventos')
    .insert({
      nombre, fecha, lugar, descripcion,
      precio: parseFloat(precio),
      capacidad: parseInt(capacidad) || 100,
      organizador_id: req.usuario?.id || null,
      publicado: true
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

module.exports = router;