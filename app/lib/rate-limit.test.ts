import { afterEach, describe, expect, it, vi } from "vitest";

import { clearAttempts, tooManyAttempts } from "./rate-limit";

describe("tooManyAttempts", () => {
  afterEach(() => vi.useRealTimers());

  it("allows the budget, then refuses the next attempt", () => {
    const key = "test:budget";
    const allowed = Array.from({ length: 3 }, () => tooManyAttempts(key, 3));

    expect(allowed).toEqual([false, false, false]);
    expect(tooManyAttempts(key, 3)).toBe(true);
  });

  it("starts a fresh budget once the window has passed", () => {
    vi.useFakeTimers();
    const key = "test:window";
    Array.from({ length: 4 }, () => tooManyAttempts(key, 3));

    vi.advanceTimersByTime(60_001);
    expect(tooManyAttempts(key, 3)).toBe(false);
  });

  it("forgets a caller when cleared", () => {
    const key = "test:clear";
    Array.from({ length: 4 }, () => tooManyAttempts(key, 3));

    clearAttempts(key);
    expect(tooManyAttempts(key, 3)).toBe(false);
  });
});
