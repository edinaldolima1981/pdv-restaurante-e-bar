const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rota de teste
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      message: 'Connection to database successful',
      time: result.rows[0]
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Rota de empresas
app.get('/api/empresas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM empresas WHERE ativa = true ORDER BY criada_em DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`🚀 PDV Restaurante API running on port ${PORT}`);
});

module.exports = app;
