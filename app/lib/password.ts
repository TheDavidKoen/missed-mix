/* 5,000 iterations is far below the OWASP floor of 600,000 and is chosen against
   a platform limit, not a threat model: the Workers free plan allows 10 ms of CPU
   per request, and PBKDF2-SHA-256 measures 14 ms at 10,000 iterations and 108 ms
   at 100,000. See the amendment to ADR 0008. The count is stored in the hash
   string, so raising it re-derives on next sign-in rather than invalidating every
   account. */
const ITERATIONS = 5_000;
const SCHEME = "pbkdf2-sha256";
const SALT_BYTES = 16;
const KEY_BITS = 256;

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    KEY_BITS,
  );

  return new Uint8Array(bits);
}

/* Compares every byte regardless of where the first difference is, so the time
   taken does not reveal how much of a guess was correct. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;

  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }

  return difference === 0;
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await derive(password, salt, ITERATIONS);

  return `${SCHEME}$${ITERATIONS}$${toBase64(salt)}$${toBase64(derived)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, salt, expected] = stored.split("$");
  if (scheme !== SCHEME) return false;

  const count = Number(iterations);
  if (!Number.isInteger(count) || count < 1) return false;

  const derived = await derive(password, fromBase64(salt), count);
  return timingSafeEqual(derived, fromBase64(expected));
}

export function needsRehash(stored: string) {
  return Number(stored.split("$")[1]) < ITERATIONS;
}
