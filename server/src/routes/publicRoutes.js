import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verifyRecord } from "../controllers/verificationController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { verificationIdValidation } from "../middleware/validators.js";

const router = Router();
const verificationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: "draft-7", legacyHeaders: false });
router.get("/verify/:verificationId", verificationLimiter, verificationIdValidation, validateRequest, verifyRecord);
export default router;
