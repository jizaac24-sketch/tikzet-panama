const express  = require('express');
const router   = express.Router();
const QRCode   = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabase');

router.post('/comprar', async (req, res) => {
  const { eventoId, nombreComprador, emailComprador } = req.body;
  if (!eventoId || !nombreComprador || !emailComprador)
    return res.status(400).json({ error: 'Datos incompletos' });

  const ticketId = uuidv4();
  const qrData   = JSON.stringify({ ticketId, eventoId, nombreComprador });
  const qrImagen = await QRCode.toDataURL(qrData);

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      id: ticketId,
      evento_id: eventoId,
      nombre_comprador: nombreComprador,
      email_comprador: emailComprador,
      qr_data: qrData,
      qr_imagen: qrImagen,
      usado: false
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({
    mensaje: 'Entrada comprada',
    ticket: { id: data.id, nombreComprador, eventoId, qrImagen }
  });
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Ticket no encontrado' });
  res.json(data);
});

module.exports = router;