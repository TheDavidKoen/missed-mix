import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("verifies the password it hashed", async () => {
    const stored = await hashPassword("a-very-long-demo-password");
    expect(await verifyPassword("a-very-long-demo-password", stored)).toBe(true);
  });

  it("rejects a different password", async () => {
    const stored = await hashPassword("a-very-long-demo-password");
    expect(await verifyPassword("a-very-long-demo-passworD", stored)).toBe(false);
  });

  it("rejects a tampered digest", async () => {
    const stored = await hashPassword("a-very-long-demo-password");
    const tampered = `${stored.slice(0, -2)}AA`;
    expect(await verifyPassword("a-very-long-demo-password", tampered)).toBe(false);
  });

  it("salts every hash, so equal passwords store differently", async () => {
    const [first, second] = await Promise.all([hashPassword("same"), hashPassword("same")]);
    expect(first).not.toBe(second);
  });

  it("verifies with the stored iteration count, not the current setting", async () => {
    const stored = await hashPassword("a-very-long-demo-password");
    const [scheme, , salt, digest] = stored.split("$");
    const otherCount = `${scheme}$1000$${salt}$${digest}`;
    expect(await verifyPassword("a-very-long-demo-password", otherCount)).toBe(false);
  });

  it("refuses unknown schemes and malformed counts", async () => {
    expect(await verifyPassword("x", "bcrypt$10$salt$hash")).toBe(false);
    expect(await verifyPassword("x", "pbkdf2-sha256$zero$salt$hash")).toBe(false);
  });
});
