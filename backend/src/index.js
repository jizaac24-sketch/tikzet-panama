require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes    = require('./routes/auth');
const eventRoutes   = require('./routes/events');
const ticketRoutes  = require('./routes/tickets');
const scannerRoutes = require('./routes/scanner');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',    authRoutes);
app.use('/api/events',  eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/scanner', scannerRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'API Tikzet Panama funcionando' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});