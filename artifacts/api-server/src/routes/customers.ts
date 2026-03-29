import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "./auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (_req, res) => {
  const result = await db.execute(sql`SELECT * FROM customers ORDER BY name ASC`);
  res.json(result.rows);
});

router.post("/", requireAuth, async (req, res) => {
  const { name, phone, email, notes } = req.body;
  if (!name) { res.status(400).json({ error: "Nome obrigatório" }); return; }
  const result = await db.execute(
    sql`INSERT INTO customers (name, phone, email, notes) VALUES (${name}, ${phone || null}, ${email || null}, ${notes || null}) RETURNING *`
  );
  res.status(201).json(result.rows[0]);
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, email, notes } = req.body;
  if (!name) { res.status(400).json({ error: "Nome obrigatório" }); return; }
  const result = await db.execute(
    sql`UPDATE customers SET name=${name}, phone=${phone || null}, email=${email || null}, notes=${notes || null} WHERE id=${id} RETURNING *`
  );
  if (result.rows.length === 0) { res.status(404).json({ error: "Cliente não encontrado" }); return; }
  res.json(result.rows[0]);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.execute(sql`DELETE FROM customers WHERE id=${id}`);
  res.json({ ok: true });
});

export default router;
