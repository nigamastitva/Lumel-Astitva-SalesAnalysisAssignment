import { Router } from "express";
import dataRefreshController from "../controllers/dataRefresh.controller";

const router = Router();

router.post("/refresh", dataRefreshController.refreshData);
router.get("/logs", dataRefreshController.getRefreshLogs);

export default router;
