import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAuth, requireAdmin } from "./auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    name: usersTable.name,
    role: usersTable.role,
    active: usersTable.active,
    createdAt: usersTable.createdAt,
  }).from(usersTable);
  res.json(users);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { username, name, password, role } = req.body;
  if (!username || !name || !password || !role) {
    res.status(400).json({ error: "Campos obrigatórios: username, name, password, role" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, name, passwordHash, role, active: true }).returning({
    id: usersTable.id, username: usersTable.username, name: usersTable.name, role: usersTable.role, active: usersTable.active, createdAt: usersTable.createdAt,
  });
  res.status(201).json(user);
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { username, name, password, role, active } = req.body;
  const updates: any = {};
  if (username !== undefined) updates.username = username;
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (active !== undefined) updates.active = active;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning({
    id: usersTable.id, username: usersTable.username, name: usersTable.name, role: usersTable.role, active: usersTable.active, createdAt: usersTable.createdAt,
  });
  if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }
  res.json(user);
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const session = (req as any).session;
  if (session.userId === id) {
    res.status(400).json({ error: "Não é possível excluir a si mesmo" });
    return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

export default router;
