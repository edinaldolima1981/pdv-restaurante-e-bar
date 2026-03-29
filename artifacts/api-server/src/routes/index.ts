import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import categoriesRouter from "./categories.js";
import productsRouter from "./products.js";
import tablesRouter from "./tables.js";
import ordersRouter from "./orders.js";
import cashRouter from "./cash.js";
import customersRouter from "./customers.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/categories", categoriesRouter);
router.use("/products", productsRouter);
router.use("/tables", tablesRouter);
router.use("/orders", ordersRouter);
router.use("/cash", cashRouter);
router.use("/customers", customersRouter);

export default router;
