import { avatars, ensureAvatarIndexes, withDb } from "./mongo";

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

export async function storeAvatar(
  env: Env,
  usernameLower: string,
  file: File,
): Promise<AvatarError | null> {
  if (file.size > MAX_BYTES) return "too-large";

  const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
  const signature = SIGNATURES.find((candidate) => candidate.match(head));
  if (!signature) return "not-an-image";

  const { Binary } = await import("mongodb");
  const bytes = new Binary(new Uint8Array(await file.arrayBuffer()));

  await withDb(env, async (db) => {
    await ensureAvatarIndexes(db);

    return avatars(db).updateOne(
      { usernameLower },
      { $set: { data: bytes, contentType: signature.type, updatedAt: new Date() } },
      { upsert: true },
    );
  });

  return null;
}

export async function readAvatar(env: Env, usernameLower: string) {
  const doc = await withDb(env, (db) =>
    avatars(db).findOne({ usernameLower }, { projection: { _id: 0, data: 1, contentType: 1 } }),
  );

  if (!doc) return null;

  return { bytes: new Uint8Array(doc.data.buffer), contentType: doc.contentType };
}
