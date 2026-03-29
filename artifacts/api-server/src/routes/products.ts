import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (_req, res) => {
  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      available: productsTable.available,
      imageUrl: productsTable.imageUrl,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));
  res.json(products.map(p => ({ ...p, price: parseFloat(p.price as unknown as string) })));
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, description, price, categoryId, available, imageUrl } = req.body;
  if (!name || price === undefined) { res.status(400).json({ error: "Nome e preço obrigatórios" }); return; }
  const [product] = await db.insert(productsTable).values({
    name, description, price: price.toString(), categoryId: categoryId || null, available: available !== false, imageUrl
  }).returning();
  res.status(201).json({ ...product, price: parseFloat(product.price as unknown as string) });
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description, price, categoryId, available, imageUrl } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = price.toString();
  if (categoryId !== undefined) updates.categoryId = categoryId || null;
  if (available !== undefined) updates.available = available;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Produto não encontrado" }); return; }
  res.json({ ...product, price: parseFloat(product.price as unknown as string) });
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ ok: true });
});

export default router;
