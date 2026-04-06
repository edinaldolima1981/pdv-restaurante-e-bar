import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const db = new Database('database.sqlite');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
  );

  CREATE TABLE IF NOT EXISTS tables (
    id TEXT PRIMARY KEY,
    number INTEGER,
    status TEXT,
    capacity INTEGER
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT,
    tableId TEXT,
    paymentStatus TEXT,
    joinedAt TEXT,
    userId TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customerId TEXT,
    tableId TEXT,
    items TEXT,
    total REAL,
    status TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT,
    price REAL,
    categoryId TEXT,
    image TEXT,
    description TEXT,
    stock INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT,
    icon TEXT,
    module TEXT
  );

  CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    email TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT,
    amount REAL,
    description TEXT,
    date TEXT,
    category TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS inventoryLogs (
    id TEXT PRIMARY KEY,
    productId TEXT,
    type TEXT,
    quantity REAL,
    reason TEXT,
    date TEXT,
    userId TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    restaurantModule INTEGER,
    groceryModule INTEGER,
    appName TEXT
  );
`);

// Create default admin if not exists
const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@admin.com');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)').run(
    crypto.randomUUID(),
    'admin@admin.com',
    hashedPassword,
    'admin'
  );
}

// Initialize default settings if not exists
const settingsExists = db.prepare('SELECT * FROM settings WHERE id = ?').get('app_config');
if (!settingsExists) {
  db.prepare('INSERT INTO settings (id, restaurantModule, groceryModule, appName) VALUES (?, ?, ?, ?)').run(
    'app_config',
    1,
    0,
    'ANOTA FÁCIL'
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Auth Routes
  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as { id: string, email: string, password: string, role: string } | undefined;

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // Generic CRUD Helper
  const setupCrud = (collection: string) => {
    app.get(`/api/${collection}`, (_req, res) => {
      const items = db.prepare(`SELECT * FROM ${collection}`).all() as { items?: string }[];
      res.json(items.map((item) => {
        if (item.items) item.items = JSON.parse(item.items);
        return item;
      }));
    });

    app.post(`/api/${collection}`, (req, res) => {
      const id = req.body.id || crypto.randomUUID();
      const data = { ...req.body, id };
      const keys = Object.keys(data);
      const values = Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
      const placeholders = keys.map(() => '?').join(',');
      
      try {
        db.prepare(`INSERT INTO ${collection} (${keys.join(',')}) VALUES (${placeholders})`).run(...values);
        res.json(data);
      } catch (err: unknown) {
        res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
      }
    });

    app.put(`/api/${collection}/:id`, (req, res) => {
      const { id } = req.params;
      const data = req.body;
      delete data.id;
      const keys = Object.keys(data);
      const values = Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
      const setClause = keys.map(k => `${k} = ?`).join(',');
      
      try {
        db.prepare(`UPDATE ${collection} SET ${setClause} WHERE id = ?`).run(...values, id);
        res.json({ id, ...data });
      } catch (err: unknown) {
        res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
      }
    });

    app.delete(`/api/${collection}/:id`, (req, res) => {
      const { id } = req.params;
      try {
        db.prepare(`DELETE FROM ${collection} WHERE id = ?`).run(id);
        res.json({ success: true });
      } catch (err: unknown) {
        res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
      }
    });
  };

  app.post('/api/batch', (req, res) => {
    const { operations } = req.body;
    if (!Array.isArray(operations)) return res.status(400).json({ error: 'Operations must be an array' });

    const transaction = db.transaction((ops) => {
      for (const op of ops) {
        const { type, collection, id, data } = op;
        if (type === 'update') {
          const keys = Object.keys(data);
          const values = Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
          const setClause = keys.map(k => `${k} = ?`).join(',');
          db.prepare(`UPDATE ${collection} SET ${setClause} WHERE id = ?`).run(...values, id);
        } else if (type === 'insert') {
          const keys = Object.keys(data);
          const values = Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
          const placeholders = keys.map(() => '?').join(',');
          db.prepare(`INSERT INTO ${collection} (${keys.join(',')}) VALUES (${placeholders})`).run(...values);
        } else if (type === 'delete') {
          db.prepare(`DELETE FROM ${collection} WHERE id = ?`).run(id);
        }
      }
    });

    try {
      transaction(operations);
      res.json({ success: true });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  ['tables', 'customers', 'orders', 'products', 'categories', 'staff', 'transactions', 'inventoryLogs', 'settings'].forEach(setupCrud);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
