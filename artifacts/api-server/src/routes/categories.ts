import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (_req, res) => {
  const categories = await db.select().from(categoriesTable);
  res.json(categories);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, color, icon } = req.body;
  if (!name) { res.status(400).json({ error: "Nome obrigatório" }); return; }
  const [cat] = await db.insert(categoriesTable).values({ name, color, icon }).returning();
  res.status(201).json(cat);
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, color, icon } = req.body;
  const [cat] = await db.update(categoriesTable).set({ name, color, icon }).where(eq(categoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Categoria não encontrada" }); return; }
  res.json(cat);
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.json({ ok: true });
});

export default router;
