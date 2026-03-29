const express  = require('express');
const router   = express.Router();
const authMidd = require('../middleware/auth');
const supabase = require('../supabase');

router.post('/validar', authMidd, async (req, res) => {
  const { qrData } = req.body;
  if (!qrData) return res.status(400).json({ error: 'QR requerido' });

  let datos;
  try { datos = JSON.parse(qrData); } catch { return res.json({ valido: false, mensaje: 'QR inválido' }); }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', datos.ticketId)
    .single();

  if (error || !ticket) return res.json({ valido: false, mensaje: 'Ticket no encontrado' });
  if (ticket.usado) return res.json({ valido: false, mensaje: 'Este QR ya fue usado' });

  await supabase
    .from('tickets')
    .update({ usado: true, usado_en: new Date().toISOString() })
    .eq('id', datos.ticketId);

  res.json({
    valido: true,
    mensaje: 'Acceso permitido',
    ticket: { id: ticket.id, nombreComprador: ticket.nombre_comprador, eventoId: ticket.evento_id }
  });
});

module.exports = router;