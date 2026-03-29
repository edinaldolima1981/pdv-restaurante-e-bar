import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable, restaurantTablesTable, cashSessionsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "./auth.js";

const router: IRouter = Router();

async function buildOrder(order: any) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const total = items.reduce((sum: number, item: any) => sum + parseFloat(item.unitPrice) * item.quantity, 0);
  let tableName: string | null = null;
  if (order.tableId) {
    const [table] = await db.select().from(restaurantTablesTable).where(eq(restaurantTablesTable.id, order.tableId));
    tableName = table ? (table.name || `Mesa ${table.number}`) : null;
  }
  return {
    ...order,
    tableName,
    items: items.map((item: any) => ({
      ...item,
      unitPrice: parseFloat(item.unitPrice),
      totalPrice: parseFloat(item.unitPrice) * item.quantity,
    })),
    total: parseFloat(order.discount || "0") > 0 ? total - parseFloat(order.discount) : total,
    discount: parseFloat(order.discount || "0"),
  };
}

router.get("/", requireAuth, async (req, res) => {
  let query = db.select().from(ordersTable).$dynamic();
  const conditions = [];
  if (req.query.status) conditions.push(eq(ordersTable.status, req.query.status as string));
  if (req.query.tableId) conditions.push(eq(ordersTable.tableId, parseInt(req.query.tableId as string)));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const orders = await query.orderBy(ordersTable.createdAt);
  const result = await Promise.all(orders.map(buildOrder));
  res.json(result);
});

router.post("/", requireAuth, async (req, res) => {
  const { tableId, notes, items } = req.body;
  const session = (req as any).session;

  const [order] = await db.insert(ordersTable).values({
    tableId: tableId || null,
    status: "open",
    notes,
    createdBy: session.name,
  }).returning();

  if (tableId) {
    await db.update(restaurantTablesTable).set({ status: "occupied", currentOrderId: order.id }).where(eq(restaurantTablesTable.id, tableId));
  }

  if (items && items.length > 0) {
    for (const item of items) {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      if (product) {
        await db.insert(orderItemsTable).values({
          orderId: order.id,
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          notes: item.notes,
        });
      }
    }
  }

  res.status(201).json(await buildOrder(order));
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Pedido não encontrado" }); return; }
  res.json(await buildOrder(order));
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, discount, paymentMethod, notes } = req.body;
  const updates: any = { updatedAt: new Date() };
  if (status !== undefined) updates.status = status;
  if (discount !== undefined) updates.discount = discount.toString();
  if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
  if (notes !== undefined) updates.notes = notes;

  const [order] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Pedido não encontrado" }); return; }

  if (status === "paid" || status === "cancelled") {
    if (order.tableId) {
      await db.update(restaurantTablesTable).set({ status: "available", currentOrderId: null }).where(eq(restaurantTablesTable.id, order.tableId));
    }
    if (status === "paid") {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
      const total = items.reduce((sum: number, item: any) => sum + parseFloat(item.unitPrice) * item.quantity, 0);
      const finalTotal = discount ? total - parseFloat(discount.toString()) : total;
      const [openSession] = await db.select().from(cashSessionsTable).where(eq(cashSessionsTable.status, "open"));
      if (openSession) {
        await db.update(cashSessionsTable).set({
          totalSales: (parseFloat(openSession.totalSales as unknown as string) + finalTotal).toString(),
          totalOrders: openSession.totalOrders + 1,
        }).where(eq(cashSessionsTable.id, openSession.id));
      }
    }
  }

  res.json(await buildOrder(order));
});

router.post("/:id/items", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { productId, quantity, notes } = req.body;
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) { res.status(404).json({ error: "Produto não encontrado" }); return; }
  await db.insert(orderItemsTable).values({
    orderId: id,
    productId,
    productName: product.name,
    quantity,
    unitPrice: product.price,
    notes,
  });
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  res.json(await buildOrder(order));
});

router.delete("/:id/items/:itemId", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const itemId = parseInt(req.params.itemId);
  await db.delete(orderItemsTable).where(and(eq(orderItemsTable.id, itemId), eq(orderItemsTable.orderId, id)));
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  res.json(await buildOrder(order));
});

export default router;
