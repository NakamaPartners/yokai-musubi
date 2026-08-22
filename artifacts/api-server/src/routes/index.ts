import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { orderingRouter } from "./ordering";

const router: IRouter = Router();

router.use(healthRouter);
router.use(orderingRouter);

export default router;
