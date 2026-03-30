const express  = require('express');
const router   = express.Router();
const QRCode   = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabase');
const { Resend } = require('resend');

router.post('/comprar', async (req, res) => {
  const { eventoId, nombreComprador, emailComprador } = req.body;
  if (!eventoId || !nombreComprador || !emailComprador)
    return res.status(400).json({ error: 'Datos incompletos' });

  const ticketId = uuidv4();
  const qrData   = JSON.stringify({ ticketId, eventoId, nombreComprador });
  const qrImagen = await QRCode.toDataURL(qrData);
  const qrBase64 = qrImagen.split('base64,')[1];
  const qrBuffer = Buffer.from(qrBase64, 'base64');

  const { error: uploadError } = await supabase.storage
    .from('qr-codes')
    .upload(`${ticketId}.png`, qrBuffer, { contentType: 'image/png' });

  if (uploadError) console.log('Error subiendo QR:', uploadError.message);

  const { data: urlData } = supabase.storage
    .from('qr-codes')
    .getPublicUrl(`${ticketId}.png`);

  const qrUrl = urlData.publicUrl;

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

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'entradas@westfordservices.com',
    to: emailComprador,
    subject: 'Tu entrada - Westford Ticket',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #a855f7;">Westford Ticket</h1>
        <h2>Hola ${nombreComprador}!</h2>
        <p>Tu entrada ha sido confirmada. Aquí está tu código QR de acceso:</p>
        <div style="text-align: center; margin: 30px 0;">
          <img src="${qrUrl}" alt="Código QR" width="200" height="200" />
        </div>
        <p style="color: #666;">Presenta este QR en la entrada del evento.</p>
        <p style="color: #666;">ID de ticket: ${ticketId}</p>
        <hr />
        <p style="font-size: 12px; color: #999;">Westford Ticket - Sistema de entradas digitales</p>
      </div>
    `
  });

  res.status(201).json({
    mensaje: 'Entrada comprada y enviada por email',
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