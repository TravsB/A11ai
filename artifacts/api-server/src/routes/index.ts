import { Router, type IRouter } from "express";
import healthRouter from "./health";
import proxyRouter from "./proxy";
import authRouter from "./auth";
import scansRouter from "./scans";
import preferencesRouter from "./preferences";
import publicScanRouter from "./public-scan";
import auditsRouter from "./audits";
import apiKeysRouter from "./api-keys";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(publicScanRouter);
router.use(auditsRouter);
router.use(apiKeysRouter);
router.use(preferencesRouter);
router.use(scansRouter);
router.use(proxyRouter);

export default router;
