import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { restaurantTablesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (_req, res) => {
  const tables = await db.select().from(restaurantTablesTable).orderBy(restaurantTablesTable.number);
  res.json(tables);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { number, name, capacity } = req.body;
  if (!number) { res.status(400).json({ error: "Número da mesa obrigatório" }); return; }
  const [table] = await db.insert(restaurantTablesTable).values({ number, name, capacity, status: "available" }).returning();
  res.status(201).json(table);
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { number, name, status, capacity } = req.body;
  const updates: any = {};
  if (number !== undefined) updates.number = number;
  if (name !== undefined) updates.name = name;
  if (status !== undefined) updates.status = status;
  if (capacity !== undefined) updates.capacity = capacity;
  const [table] = await db.update(restaurantTablesTable).set(updates).where(eq(restaurantTablesTable.id, id)).returning();
  if (!table) { res.status(404).json({ error: "Mesa não encontrada" }); return; }
  res.json(table);
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(restaurantTablesTable).where(eq(restaurantTablesTable.id, id));
  res.json({ ok: true });
});

export default router;
