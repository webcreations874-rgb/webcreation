import "dotenv/config";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { connectDatabase } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

// Normalize environment variables with safe fallbacks
for (const variable of ["FRONTEND_URL", "PUBLIC_BASE_URL"]) {
  if (process.env[variable]) {
    try {
      const url = new URL(process.env[variable].trim());
      process.env[variable] = url.origin;
    } catch {
      console.warn(`[WARN] Invalid URL format for ${variable}: "${process.env[variable]}".`);
    }
  } else {
    process.env[variable] = "http://localhost:5173";
  }
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn("[WARN] JWT_SECRET missing or shorter than 32 chars. Using secure fallback for process start.");
  process.env.JWT_SECRET = process.env.JWT_SECRET || "default_fallback_jwt_secret_min_32_characters_for_security";
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method) && req.path !== "/api/auth/logout" &&
    (!req.body || typeof req.body !== "object" || Array.isArray(req.body))) {
    return res.status(400).json({ message: "Request body must be a JSON object." });
  }
  next();
});

app.get("/", (req, res) => res.json({ status: "ok", message: "QR Record Verify API is running" }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.info(`QR Record Verify API listening on port ${port}.`);
});

server.on("error", (err) => {
  console.error("Server listener error on primary port:", err.message);
});

if (!process.env.PORT && port !== 5000) {
  try {
    const secondaryServer = app.listen(5000, () => {
      console.info("QR Record Verify API also listening on secondary port 5000.");
    });
    secondaryServer.on("error", () => {});
  } catch {
    // ignore
  }
}

connectDatabase().catch((error) => {
  console.error("MongoDB connection error:", error.message);
});

export default app;
export { app };
