import { Router } from "express";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";
import {
  changePassword, forgotPassword, getCurrentAdmin, login, logout, resetPassword, updateProfile
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { loginValidation } from "../middleware/validators.js";

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false });
const recoveryLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: "draft-7", legacyHeaders: false });

router.post("/login", loginLimiter, loginValidation, validateRequest, login);
router.post("/logout", logout);
router.get("/me", requireAuth, getCurrentAdmin);
router.post("/forgot-password", recoveryLimiter, body("email").isEmail().withMessage("Enter a valid email address."), validateRequest, forgotPassword);
router.post(
  "/reset-password",
  recoveryLimiter,
  body("token").isString().notEmpty(),
  body("password").isString().isLength({ min: 12, max: 128 }),
  validateRequest,
  resetPassword
);
router.put("/profile", requireAuth, updateProfile);
router.put("/password", requireAuth, changePassword);

export default router;
