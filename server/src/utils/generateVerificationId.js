import { randomBytes } from "node:crypto";

export function generateVerificationId() {
  return randomBytes(24).toString("base64url");
}
