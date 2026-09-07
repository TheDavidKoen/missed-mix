/* rate-limit.ts — In-isolate request budgets. limitKey identifies a caller,
   tooManyAttempts records an attempt and reports whether the budget is spent. */

const WINDOW_MS = 60_000;

export const SIGN_IN_ATTEMPTS = 8;
export const SEARCH_REQUESTS = 40;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function limitKey(request: Request, scope: string) {
  const ip = request.headers.get("CF-Connecting-IP") ?? "local";
  return `${scope}:${ip}`;
}

export function tooManyAttempts(key: string, max: number) {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > max;
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}
