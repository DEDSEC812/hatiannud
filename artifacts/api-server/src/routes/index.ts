import { Router, type IRouter } from "express";
import healthRouter from "./health";
import videosRouter from "./videos";
import commentsRouter from "./comments";
import usersRouter from "./users";
import subscriptionsRouter from "./subscriptions";
import supportRouter from "./support";
import adsRouter from "./ads";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(videosRouter);
router.use(commentsRouter);
router.use(usersRouter);
router.use(subscriptionsRouter);
router.use(supportRouter);
router.use(adsRouter);
router.use(adminRouter);

export default router;
