import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { cashSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth.js";

const router: IRouter = Router();

router.get("/sessions", requireAuth, async (_req, res) => {
  const sessions = await db.select().from(cashSessionsTable).orderBy(cashSessionsTable.openedAt);
  res.json(sessions.map((s: any) => ({
    ...s,
    openingBalance: parseFloat(s.openingBalance),
    closingBalance: s.closingBalance ? parseFloat(s.closingBalance) : null,
    totalSales: parseFloat(s.totalSales),
  })));
});

router.get("/sessions/current", requireAuth, async (_req, res) => {
  const [session] = await db.select().from(cashSessionsTable).where(eq(cashSessionsTable.status, "open"));
  if (!session) { res.status(404).json({ error: "Nenhuma sessão aberta" }); return; }
  res.json({
    ...session,
    openingBalance: parseFloat(session.openingBalance as unknown as string),
    closingBalance: session.closingBalance ? parseFloat(session.closingBalance as unknown as string) : null,
    totalSales: parseFloat(session.totalSales as unknown as string),
  });
});

router.post("/sessions", requireAuth, async (req, res) => {
  const { openingBalance } = req.body;
  const sessionUser = (req as any).session;
  const [existing] = await db.select().from(cashSessionsTable).where(eq(cashSessionsTable.status, "open"));
  if (existing) { res.status(400).json({ error: "Já existe uma sessão de caixa aberta" }); return; }
  const [session] = await db.insert(cashSessionsTable).values({
    openedBy: sessionUser.name,
    openingBalance: openingBalance.toString(),
    totalSales: "0",
    totalOrders: 0,
    status: "open",
  }).returning();
  res.status(201).json({
    ...session,
    openingBalance: parseFloat(session.openingBalance as unknown as string),
    totalSales: parseFloat(session.totalSales as unknown as string),
  });
});

router.post("/sessions/:id/close", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { closingBalance } = req.body;
  const [session] = await db.update(cashSessionsTable).set({
    status: "closed",
    closedAt: new Date(),
    closingBalance: closingBalance.toString(),
  }).where(eq(cashSessionsTable.id, id)).returning();
  if (!session) { res.status(404).json({ error: "Sessão não encontrada" }); return; }
  res.json({
    ...session,
    openingBalance: parseFloat(session.openingBalance as unknown as string),
    closingBalance: session.closingBalance ? parseFloat(session.closingBalance as unknown as string) : null,
    totalSales: parseFloat(session.totalSales as unknown as string),
  });
});

export default router;
