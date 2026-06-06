const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pool = require('./db');

const authRoutes = require('./routes/auth.routes');
const plantasRoutes = require('./routes/plantas.routes');
const ventasRoutes = require('./routes/ventas.routes');
const reportesRoutes = require('./routes/reportes.routes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.json({
    mensaje: 'Backend Vivero ALIS funcionando correctamente'
  });
});

app.get('/api/probar-db', async (req, res) => {
  try {
    const [resultado] = await pool.query('SELECT 1 + 1 AS resultado');

    res.json({
      mensaje: 'Conexión a MySQL correcta',
      resultado: resultado[0].resultado
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al conectar con MySQL',
      error: error.message
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/plantas', plantasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reportes', reportesRoutes);

app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});