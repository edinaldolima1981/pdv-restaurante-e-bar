const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-jwt-super-seguro-aqui';

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// AUTH: Login Administrador
app.post('/api/auth/admin', async (req, res) => {
  const { senha } = req.body;
  // Para fins de demonstração, senha padrão: admin123
  // Em produção, isso deve ser verificado no banco com hash
  if (senha === 'admin123' || senha === '0000') {
    const user = { id: 'admin', nome: 'Administrador', cargo: 'gerente', img: '👔' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user });
  }
  res.status(401).json({ error: 'Senha incorreta' });
});

// AUTH: Login Colaborador (PIN)
app.post('/api/auth/colab', async (req, res) => {
  const { pin } = req.body;
  
  // Lista de colaboradores mock (mesma do frontend) para fallback
  const staff = [
    { id:1, nome:"Admin",   pin:"0000", cargo:"gerente",  img:"👔" },
    { id:2, nome:"João",    pin:"1234", cargo:"garcom",   img:"🧑‍🍳" },
    { id:3, nome:"Ana",     pin:"2345", cargo:"garcom",   img:"👩‍🍳" },
    { id:4, nome:"Carlos",  pin:"3456", cargo:"garcom",   img:"🧑‍🍳" },
    { id:5, nome:"Maria",   pin:"4567", cargo:"garcom",   img:"👩‍🍳" },
    { id:6, nome:"Pedro",   pin:"5678", cargo:"garcom",   img:"🧑‍🍳" },
    { id:7, nome:"Cozinha", pin:"9999", cargo:"cozinha",  img:"🍳" },
  ];

  const found = staff.find(s => s.pin === pin);
  if (found) {
    const user = { ...found };
    delete user.pin;
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, user });
  }
  res.status(401).json({ error: 'PIN inválido' });
});

// Rota de teste DB
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

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PDV Restaurante API running on port ${PORT}`);
});
