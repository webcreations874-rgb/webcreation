import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Admin from "../models/Admin.js";
import AuditLog from "../models/AuditLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cookieOptions = (req) => {
  const origin = req?.get?.("origin");
  const forwardedProto = req?.get?.("x-forwarded-proto")?.split(",")[0]?.trim();
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    process.env.NODE_ENV === "production" ||
    forwardedProto === "https" ||
    req?.protocol === "https";
  let crossOrigin = false;
  if (origin && req?.get?.("host")) {
    try {
      crossOrigin = new URL(origin).host !== req.get("host");
    } catch {
      crossOrigin = false;
    }
  }
  return {
    httpOnly: true,
    secure,
    sameSite: secure && crossOrigin ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000
  };
};

export const login = asyncHandler(async (req, res) => {
  const identifier = String(req.body.identifier ?? req.body.email ?? "").trim().toLowerCase();
  const admin = await Admin.findOne({
    $or: [{ email: identifier }, { username: identifier }]
  }).select("+password +sessionVersion");
  if (!admin || !admin.isActive || !(await bcrypt.compare(req.body.password, admin.password))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }
  const token = jwt.sign({ sub: admin.id, role: admin.role, ver: admin.sessionVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });
  res.cookie("qr_session", token, cookieOptions(req));
  res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, username: admin.username, role: admin.role } });
});

export const logout = (req, res) => {
  res.clearCookie("qr_session", { ...cookieOptions(req), maxAge: undefined });
  res.json({ message: "Signed out." });
};

export const getCurrentAdmin = (req, res) => {
  res.json({ admin: req.admin });
};

export const forgotPassword = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production" && (!process.env.SMTP_HOST || !process.env.SMTP_FROM)) {
    return res.status(503).json({ message: "Password recovery is not configured. Contact your system administrator." });
  }
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const admin = await Admin.findOne({ email, isActive: true }).select("+resetTokenHash +resetTokenExpiresAt");
  if (admin) {
    const resetToken = randomBytes(32).toString("base64url");
    admin.resetTokenHash = createHash("sha256").update(resetToken).digest("hex");
    admin.resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await admin.save();
    const resetUrl = new URL("/admin/reset-password", process.env.FRONTEND_URL);
    resetUrl.searchParams.set("token", resetToken);
    if (process.env.SMTP_HOST) {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
      });
      await transport.sendMail({
        from: process.env.SMTP_FROM,
        to: admin.email,
        subject: "Reset your QR Record Verify password",
        text: `Use this one-time link within 30 minutes: ${resetUrl}`
      });
    } else {
      console.info(`Development password reset link for ${admin.email}: ${resetUrl}`);
    }
  }
  res.json({ message: "If an active account matches that email, password reset instructions have been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body.token ?? "");
  const password = String(req.body.password ?? "");
  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({ message: "Password must be between 12 and 128 characters." });
  }
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = await Admin.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: new Date() },
    isActive: true
  }).select("+password +sessionVersion +resetTokenHash +resetTokenExpiresAt");
  if (!admin) return res.status(400).json({ message: "This password reset link is invalid or has expired." });
  admin.password = await bcrypt.hash(password, 12);
  admin.sessionVersion += 1;
  admin.resetTokenHash = undefined;
  admin.resetTokenExpiresAt = undefined;
  await admin.save();
  res.json({ message: "Password updated. You can now sign in." });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  if (!name || name.length > 120) return res.status(400).json({ message: "Name is required and must be 120 characters or fewer." });
  const admin = await Admin.findByIdAndUpdate(req.admin.id, { name }, { new: true, runValidators: true }).select("name email role");
  await AuditLog.create({ adminId: req.admin.id, action: "profile.updated" });
  res.json({ admin });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof newPassword !== "string" || newPassword.length < 12 || newPassword.length > 128) {
    return res.status(400).json({ message: "New password must be between 12 and 128 characters." });
  }
  const admin = await Admin.findById(req.admin.id).select("+password +sessionVersion");
  if (!(await bcrypt.compare(String(currentPassword ?? ""), admin.password))) {
    return res.status(400).json({ message: "Current password is incorrect." });
  }
  admin.password = await bcrypt.hash(newPassword, 12);
  admin.sessionVersion += 1;
  await admin.save();
  await AuditLog.create({ adminId: admin.id, action: "password.changed" });
  res.clearCookie("qr_session", { ...cookieOptions(req), maxAge: undefined });
  res.json({ message: "Password changed. Sign in again with your new password." });
});
