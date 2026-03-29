import { db } from "@workspace/db";
import { usersTable, categoriesTable, productsTable, restaurantTablesTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  await db.insert(usersTable).values({
    username: "admin",
    name: "Administrador",
    passwordHash: adminPassword,
    role: "admin",
    active: true,
  }).onConflictDoNothing();
  console.log("Admin user created: admin / admin123");

  await db.insert(categoriesTable).values([
    { name: "Entradas", color: "#f59e0b", icon: "🥗" },
    { name: "Pratos Principais", color: "#10b981", icon: "🍽️" },
    { name: "Sobremesas", color: "#ec4899", icon: "🍰" },
    { name: "Bebidas", color: "#3b82f6", icon: "🥤" },
    { name: "Pizzas", color: "#ef4444", icon: "🍕" },
  ]).onConflictDoNothing();
  console.log("Categories created");

  const [cats] = await db.select().from(categoriesTable).limit(1);
  const allCats = await db.select().from(categoriesTable);
  const catMap = Object.fromEntries(allCats.map((c: any) => [c.name, c.id]));

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
  console.log("Products created");

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
  console.log("Tables created");

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
