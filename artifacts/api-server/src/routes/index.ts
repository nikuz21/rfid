import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import transactionsRouter from "./transactions";
import fareRoutesRouter from "./fareRoutes";
import dashboardRouter from "./dashboard";
import rfidRouter from "./rfid";
import webhookRouter from "./webhook"; // Ensure file name is webhook.ts
import { requireAuth } from "../middleware/require-auth";

const router: IRouter = Router();

// 1. Public Routes (No Login Required)
router.use(healthRouter);
router.use(authRouter);
router.use(rfidRouter);

// 2. Webhook Route (MUST be Public for PayMongo to reach it)
// Path: /webhook
router.use("/webhook", webhookRouter);

// 3. Protected Routes (Login Required)
router.use(requireAuth); // Everything below this line requires a token
router.use(usersRouter);
router.use(transactionsRouter);
router.use(fareRoutesRouter);
router.use(dashboardRouter);

export default router;
