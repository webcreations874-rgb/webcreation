import { Router } from "express";
import { getRecentRecords, getStats } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
router.use(requireAuth);
router.get("/stats", getStats);
router.get("/recent-records", getRecentRecords);
export default router;
