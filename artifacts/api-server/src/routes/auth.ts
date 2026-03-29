import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, sessionsTable } from "@workspace/db";
import { eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const router: IRouter = Router();

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function getSession(token: string) {
  const now = new Date();
  const [session] = await db
    .select({ userId: sessionsTable.userId })
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token));
  if (!session) return null;
  return session;
}

export function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  const token = authHeader.slice(7);
  const now = new Date();
  db.select({ userId: sessionsTable.userId })
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token))
    .then(([session]) => {
      if (!session) {
        res.status(401).json({ error: "Sessão inválida" });
        return;
      }
      db.select().from(usersTable).where(eq(usersTable.id, session.userId)).then(([user]) => {
        if (!user || !user.active) {
          res.status(401).json({ error: "Usuário inativo" });
          return;
        }
        req.session = { userId: user.id, username: user.username, name: user.name, role: user.role };
        req.token = token;
        next();
      });
    })
    .catch(() => {
      res.status(500).json({ error: "Erro interno" });
    });
}

export function requireAdmin(req: any, res: any, next: any) {
  if (req.session?.role !== "admin") {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }
  next();
}

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Usuário e senha obrigatórios" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user || !user.active) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(sessionsTable).values({ token, userId: user.id, expiresAt });
  res.json({
    user: { id: user.id, username: user.username, name: user.name, role: user.role, active: user.active, createdAt: user.createdAt },
    token,
  });
});

router.post("/logout", requireAuth, async (req, res) => {
  await db.delete(sessionsTable).where(eq(sessionsTable.token, (req as any).token));
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const session = (req as any).session;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) {
    res.status(401).json({ error: "Usuário não encontrado" });
    return;
  }
  res.json({ id: user.id, username: user.username, name: user.name, role: user.role, active: user.active, createdAt: user.createdAt });
});

export default router;
