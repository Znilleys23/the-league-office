import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leaguesRouter from "./leagues";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leaguesRouter);

export default router;
