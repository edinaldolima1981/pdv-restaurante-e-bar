const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'pdvrestaurante',
  password: process.env.DB_PASSWORD || 'pdvrestaurante123',
  database: process.env.DB_NAME || 'pdv_restaurante',
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
