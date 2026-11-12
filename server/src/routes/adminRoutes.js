import { Router } from "express";
import { getVerificationLogs } from "../controllers/verificationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/verification-logs", requireAuth, getVerificationLogs);
export default router;
