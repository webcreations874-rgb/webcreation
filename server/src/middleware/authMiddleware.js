import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const token = req.cookies?.qr_session || bearerToken;
    if (!token) return res.status(401).json({ message: "Authentication required." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(payload.sub).select("name email username role isActive +sessionVersion");
    if (!admin || !admin.isActive || payload.ver !== admin.sessionVersion) {
      return res.status(401).json({ message: "Authentication required." });
    }
    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }
    next(error);
  }
}
