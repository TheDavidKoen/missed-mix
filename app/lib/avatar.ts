const MAX_BYTES = 2 * 1024 * 1024;
const SNIFF_BYTES = 12;

const SIGNATURES = [
  { type: "image/jpeg", match: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/png",
    match: (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    type: "image/webp",
    match: (b: Uint8Array) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
];

export type AvatarError = "too-large" | "not-an-image";

function keyFor(usernameLower: string) {
  return `avatars/${usernameLower}`;
}

export async function storeAvatar(
  env: Env,
  usernameLower: string,
  file: File,
): Promise<AvatarError | null> {
  if (file.size > MAX_BYTES) return "too-large";

  const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
  const signature = SIGNATURES.find((candidate) => candidate.match(head));
  if (!signature) return "not-an-image";

  await env.AVATARS.put(keyFor(usernameLower), await file.arrayBuffer(), {
    httpMetadata: { contentType: signature.type },
  });

  return null;
}

export function readAvatar(env: Env, usernameLower: string) {
  return env.AVATARS.get(keyFor(usernameLower));
}
