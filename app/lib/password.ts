/* password.ts — Password hashing over Web Crypto. hashPassword derives a salted PBKDF2
   digest, verifyPassword re-derives it with the parameters stored alongside and compares
   in constant time. */

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

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
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
  const derived = await deriveKey(password, salt, ITERATIONS);

  return `${SCHEME}$${ITERATIONS}$${toBase64(salt)}$${toBase64(derived)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, salt, expected] = stored.split("$");
  if (scheme !== SCHEME) return false;

  const count = Number(iterations);
  if (!Number.isInteger(count) || count < 1) return false;

  const derived = await deriveKey(password, fromBase64(salt), count);
  return timingSafeEqual(derived, fromBase64(expected));
}
