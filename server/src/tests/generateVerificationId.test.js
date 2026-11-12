import test from "node:test";
import assert from "node:assert/strict";
import { generateVerificationId } from "../utils/generateVerificationId.js";

test("verification IDs are URL-safe and have 192 bits of entropy", () => {
  const first = generateVerificationId();
  const second = generateVerificationId();
  assert.match(first, /^[A-Za-z0-9_-]{32}$/);
  assert.notEqual(first, second);
});
