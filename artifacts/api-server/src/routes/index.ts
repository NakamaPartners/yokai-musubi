import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import { orderingRouter } from "./ordering.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(orderingRouter);

export default router;
