/* Per-isolate, so it is a speed bump rather than a guarantee: Cloudflare runs
   many isolates and an attacker spread across them gets a multiple of this
   budget. It costs nothing, needs no storage, and removes the case the app this
   replaces actually suffered, which was unlimited sequential guessing against
   one endpoint. A durable limiter arrives with the stage 9 hardening pass. */
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
