import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";

const { MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || ADMIN_EMAIL?.split("@")[0];
if (!MONGODB_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_USERNAME) {
  console.error("Set MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD in the server environment.");
  process.exitCode = 1;
} else if (ADMIN_PASSWORD.length < 8 || ADMIN_PASSWORD.length > 128) {
  console.error("ADMIN_PASSWORD must be between 8 and 128 characters.");
  process.exitCode = 1;
} else if (!/^[a-z0-9._@-]{1,40}$/i.test(ADMIN_USERNAME)) {
  console.error("ADMIN_USERNAME must be 1–40 letters, numbers, dots, underscores, @, or hyphens.");
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(MONGODB_URI);
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const username = ADMIN_USERNAME.trim().toLowerCase();
    if (await Admin.exists({ email })) throw new Error("An administrator with that email already exists.");
    if (await Admin.exists({ username })) throw new Error("An administrator with that username already exists.");
    await Admin.create({
      name: ADMIN_NAME.trim(),
      email,
      username,
      password: await bcrypt.hash(ADMIN_PASSWORD, 12)
    });
    console.info(`Administrator created: ${username} (${email})`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
