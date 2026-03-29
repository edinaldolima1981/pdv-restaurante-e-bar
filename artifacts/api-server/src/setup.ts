import { db } from "@workspace/db";
import { usersTable, categoriesTable, productsTable, restaurantTablesTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "./lib/logger";

export async function runSetup() {
  try {
    logger.info("Running database setup...");

    // Create tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employee',
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#f97316',
        icon TEXT DEFAULT '🍽️',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        available BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS restaurant_tables (
        id SERIAL PRIMARY KEY,
        number INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 4,
        status TEXT NOT NULL DEFAULT 'available',
        current_order_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        table_id INTEGER REFERENCES restaurant_tables(id),
        table_name TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        payment_method TEXT,
        total NUMERIC(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price NUMERIC(10,2) NOT NULL,
        total_price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cash_sessions (
        id SERIAL PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'open',
        opening_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
        closing_balance NUMERIC(10,2),
        total_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
        total_orders INTEGER NOT NULL DEFAULT 0,
        opened_at TIMESTAMP DEFAULT NOW() NOT NULL,
        closed_at TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    logger.info("Tables ensured.");

    // Seed admin user
    const adminHash = await bcrypt.hash("admin123", 10);
    await db.insert(usersTable).values({
      username: "admin",
      name: "Administrador",
      passwordHash: adminHash,
      role: "admin",
      active: true,
    }).onConflictDoNothing();

    // Seed categories
    await db.insert(categoriesTable).values([
      { name: "Entradas", color: "#f59e0b", icon: "🥗" },
      { name: "Pratos Principais", color: "#10b981", icon: "🍽️" },
      { name: "Sobremesas", color: "#ec4899", icon: "🍰" },
      { name: "Bebidas", color: "#3b82f6", icon: "🥤" },
      { name: "Pizzas", color: "#ef4444", icon: "🍕" },
    ]).onConflictDoNothing();

    // Seed products
    const allCats = await db.select().from(categoriesTable);
    const catMap = Object.fromEntries(allCats.map((c: any) => [c.name, c.id]));

    if (Object.keys(catMap).length > 0) {
      await db.insert(productsTable).values([
        { name: "Salada Caesar", description: "Alface, croutons, queijo parmesão", price: "28.90", categoryId: catMap["Entradas"], available: true },
        { name: "Bruschetta", description: "Pão italiano com tomate e manjericão", price: "22.00", categoryId: catMap["Entradas"], available: true },
        { name: "Filé ao Molho", description: "Filé mignon com molho madeira", price: "65.90", categoryId: catMap["Pratos Principais"], available: true },
        { name: "Frango Grelhado", description: "Frango grelhado com legumes", price: "42.50", categoryId: catMap["Pratos Principais"], available: true },
        { name: "Salmão Grelhado", description: "Salmão com purê de batatas", price: "78.00", categoryId: catMap["Pratos Principais"], available: true },
        { name: "Petit Gateau", description: "Bolo quente de chocolate com sorvete", price: "28.00", categoryId: catMap["Sobremesas"], available: true },
        { name: "Pudim", description: "Pudim de leite condensado", price: "18.00", categoryId: catMap["Sobremesas"], available: true },
        { name: "Refrigerante", description: "Coca-Cola, Guaraná (lata)", price: "8.00", categoryId: catMap["Bebidas"], available: true },
        { name: "Suco Natural", description: "Laranja, Limão, Maracujá", price: "14.00", categoryId: catMap["Bebidas"], available: true },
        { name: "Água Mineral", description: "Com ou sem gás", price: "6.00", categoryId: catMap["Bebidas"], available: true },
        { name: "Pizza Margherita", description: "Molho, mussarela, manjericão", price: "52.00", categoryId: catMap["Pizzas"], available: true },
        { name: "Pizza Calabresa", description: "Molho, mussarela, calabresa, cebola", price: "55.00", categoryId: catMap["Pizzas"], available: true },
      ]).onConflictDoNothing();
    }

    // Seed tables
    await db.insert(restaurantTablesTable).values([
      { number: 1, name: "Mesa 1", capacity: 4, status: "available" },
      { number: 2, name: "Mesa 2", capacity: 4, status: "available" },
      { number: 3, name: "Mesa 3", capacity: 6, status: "available" },
      { number: 4, name: "Mesa 4", capacity: 2, status: "available" },
      { number: 5, name: "Mesa 5", capacity: 4, status: "available" },
      { number: 6, name: "Mesa 6", capacity: 6, status: "available" },
      { number: 7, name: "Mesa 7", capacity: 8, status: "available" },
      { number: 8, name: "Mesa 8", capacity: 4, status: "available" },
    ]).onConflictDoNothing();

    logger.info("Database setup complete. Admin: admin / admin123");
  } catch (err) {
    logger.error({ err }, "Database setup failed");
    throw err;
  }
}
