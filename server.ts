import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { randomUUID } from 'crypto';

const { Pool } = pg;

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    store_id: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pdv_saas';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Initialize Database
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        store_id TEXT REFERENCES stores(id)
      );

      CREATE TABLE IF NOT EXISTS tables (
        id TEXT PRIMARY KEY,
        store_id TEXT REFERENCES stores(id),
        number INTEGER,
        status TEXT,
        capacity INTEGER
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        store_id TEXT REFERENCES stores(id),
        name TEXT,
        table_id TEXT,
        payment_status TEXT,
        joined_at TEXT,
        user_id TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        store_id TEXT REFERENCES stores(id),
        customer_id TEXT,
        table_id TEXT,
        items JSONB,
        total REAL,
        status TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        store_id TEXT REFERENCES stores(id),
        name TEXT,
        price REAL,
        category_id TEXT,
        image TEXT,
        description TEXT,
        stock INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        store_id TEXT REFERENCES stores(id),
        name TEXT,
        icon TEXT,
        module TEXT
      );

      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        store_id TEXT REFERENCES stores(id),
        name TEXT,
        role TEXT,
        email TEXT
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        store_id TEXT REFERENCES stores(id),
        type TEXT,
        amount REAL,
        description TEXT,
        date TEXT,
        category TEXT,
        status TEXT
      );

      CREATE TABLE IF NOT EXISTS inventory_logs (
        id TEXT PRIMARY KEY,
        store_id TEXT REFERENCES stores(id),
        product_id TEXT,
        type TEXT,
        quantity REAL,
        reason TEXT,
        date TEXT,
        user_id TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        store_id TEXT REFERENCES stores(id),
        restaurant_module BOOLEAN DEFAULT TRUE,
        grocery_module BOOLEAN DEFAULT FALSE,
        app_name TEXT
      );
    `);

    // Create default store if not exists
    const defaultStoreId = 'default_store';
    const storeRes = await client.query('SELECT * FROM stores WHERE id = $1', [defaultStoreId]);
    if (storeRes.rowCount === 0) {
      await client.query('INSERT INTO stores (id, name) VALUES ($1, $2)', [defaultStoreId, 'Loja Padrão']);
    }

    // Create default admin if not exists
    const adminEmail = 'admin@admin.com';
    const userRes = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (userRes.rowCount === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await client.query(
        'INSERT INTO users (id, email, password, role, store_id) VALUES ($1, $2, $3, $4, $5)',
        [randomUUID(), adminEmail, hashedPassword, 'admin', defaultStoreId]
      );
    }

    // Initialize default settings if not exists
    const settingsRes = await client.query('SELECT * FROM settings WHERE id = $1', ['app_config']);
    if (settingsRes.rowCount === 0) {
      await client.query(
        'INSERT INTO settings (id, store_id, restaurant_module, grocery_module, app_name) VALUES ($1, $2, $3, $4, $5)',
        ['app_config', defaultStoreId, true, false, 'ANOTA FÁCIL']
      );
    }
  } finally {
    client.release();
  }
}

async function startServer() {
  // Initialize database in the background
  initDb().then(() => {
    console.log('Database initialized successfully.');
  }).catch(err => {
    console.error('Failed to initialize database:', err);
  });
  
  const app = express();
  const PORT = 3000; // Use hardcoded port 3000 as per guidelines

  app.use(cors());
  app.use(express.json());

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: 'connected' });
  });

  // Auth Middleware
  const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: unknown, user: unknown) => {
      if (err) return res.sendStatus(403);
      req.user = user as AuthRequest['user'];
      next();
    });
  };

  // Auth Routes
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, store_id: user.store_id }, JWT_SECRET);
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, store_id: user.store_id } });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ error: error.message });
    }
  });

  // Generic CRUD Helper
  const setupCrud = (collection: string) => {
    const tableName = collection === 'inventoryLogs' ? 'inventory_logs' : collection;
    
    app.get(`/api/${collection}`, authenticateToken as express.RequestHandler, async (req: AuthRequest, res: Response) => {
      try {
        const result = await pool.query(`SELECT * FROM ${tableName} WHERE store_id = $1`, [req.user?.store_id]);
        res.json(result.rows);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
      }
    });

    app.post(`/api/${collection}`, authenticateToken as express.RequestHandler, async (req: AuthRequest, res: Response) => {
      const id = req.body.id || randomUUID();
      const data = { ...req.body, id, store_id: req.user?.store_id };
      
      // Convert camelCase keys to snake_case for DB if necessary, 
      // but here we'll just map them directly based on the schema we created.
      // For simplicity, we'll assume the body matches the snake_case schema or we map it.
      
      const keys = Object.keys(data).map(k => k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`));
      const values = Object.values(data);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
      
      try {
        await pool.query(`INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`, values);
        res.json(data);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
      }
    });

    app.put(`/api/${collection}/:id`, authenticateToken as express.RequestHandler, async (req: AuthRequest, res: Response) => {
      const { id } = req.params;
      const data = { ...req.body };
      delete data.id;
      delete data.store_id;
      
      const keys = Object.keys(data).map(k => k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`));
      const values = Object.values(data);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(',');
      
      try {
        await pool.query(`UPDATE ${tableName} SET ${setClause} WHERE id = $${keys.length + 1} AND store_id = $${keys.length + 2}`, [...values, id, req.user?.store_id]);
        res.json({ id, ...data });
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
      }
    });

    app.delete(`/api/${collection}/:id`, authenticateToken as express.RequestHandler, async (req: AuthRequest, res: Response) => {
      const { id } = req.params;
      try {
        await pool.query(`DELETE FROM ${tableName} WHERE id = $1 AND store_id = $2`, [id, req.user?.store_id]);
        res.json({ success: true });
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
      }
    });
  };

  app.post('/api/batch', authenticateToken as express.RequestHandler, async (req: AuthRequest, res: Response) => {
    const { operations } = req.body;
    if (!Array.isArray(operations)) return res.status(400).json({ error: 'Operations must be an array' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const op of operations) {
        const { type, collection, id, data } = op;
        const tableName = collection === 'inventoryLogs' ? 'inventory_logs' : collection;
        
        if (type === 'update') {
          const updateData = { ...data };
          delete updateData.id;
          delete updateData.store_id;
          const keys = Object.keys(updateData).map(k => k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`));
          const values = Object.values(updateData);
          const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(',');
          await client.query(`UPDATE ${tableName} SET ${setClause} WHERE id = $${keys.length + 1} AND store_id = $${keys.length + 2}`, [...values, id, req.user?.store_id]);
        } else if (type === 'insert') {
          const insertData = { ...data, store_id: req.user?.store_id };
          const keys = Object.keys(insertData).map(k => k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`));
          const values = Object.values(insertData);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
          await client.query(`INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`, values);
        } else if (type === 'delete') {
          await client.query(`DELETE FROM ${tableName} WHERE id = $1 AND store_id = $2`, [id, req.user?.store_id]);
        }
      }
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err: unknown) {
      await client.query('ROLLBACK');
      const error = err as Error;
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
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

  console.log('Attempting to start server on port', PORT);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
