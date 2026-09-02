import type { Binary, Collection, Db } from "mongodb";

import type { PickKey } from "~/content";
import type { MusicPick } from "./spotify";

export type Account = {
  username: string;
  usernameLower: string;
  passwordHash: string;
  createdAt: Date;
};

/* A MongoClient cannot be reused across invocations: the Workers runtime ties
   open sockets to the I/O context of the request that created them, so a client
   held in module scope throws on the next request. Every call therefore pays a
   fresh handshake. That is latency, not CPU, and CPU is the metered resource.
   See ADR 0009. */
export async function withDb<T>(env: Env, run: (db: Db) => Promise<T>): Promise<T> {
  /* Imported here rather than at module scope so the driver is only evaluated on
     a request that actually reaches the database. React Router loads every route
     module to build its manifest, so a top-level import would drag the driver
     into the graph of every page, and under Vite dev that fails: see the punycode
     note in the README. This keeps the whole UI iterable with `pnpm dev`. */
  const { MongoClient } = await import("mongodb");

  const client = new MongoClient(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5_000,
    connectTimeoutMS: 5_000,
  });

  try {
    await client.connect();
    return await run(client.db(env.MONGODB_DB));
  } finally {
    await client.close();
  }
}

export function accounts(db: Db): Collection<Account> {
  return db.collection<Account>("accounts");
}

/* Registration depends on this index to reject a username that is already taken,
   because a check-then-insert loses the race between two simultaneous signups.
   `scripts/init-db.mjs` creates it as well, but an index created once by hand is
   not a guarantee: this collection was found without it on 2026-08-31, after which
   two accounts shared a username. Asserting it here makes the invariant belong to
   the code that relies on it.

   createIndex is idempotent, and the flag makes this one round trip per isolate
   rather than per request. A module-scope boolean is safe to keep across requests;
   a cached client or promise would not be, for the reason above. */
let accountIndexesEnsured = false;

export async function ensureAccountIndexes(db: Db) {
  if (accountIndexesEnsured) return;

  await accounts(db).createIndex(
    { usernameLower: 1 },
    { unique: true, name: "usernameLower_unique" },
  );

  accountIndexesEnsured = true;
}

export type Profile = {
  avatarUpdatedAt: Date | null;
  usernameLower: string;
  firstName: string;
  description: string;
  picks: Record<PickKey, MusicPick | null>;
  createdAt: Date;
  updatedAt: Date;
};

export function profiles(db: Db): Collection<Profile> {
  return db.collection<Profile>("profiles");
}

let profileIndexesEnsured = false;

export async function ensureProfileIndexes(db: Db) {
  if (profileIndexesEnsured) return;

  await profiles(db).createIndex(
    { usernameLower: 1 },
    { unique: true, name: "profile_usernameLower_unique" },
  );

  profileIndexesEnsured = true;
}

export type Avatar = {
  usernameLower: string;
  data: Binary;
  contentType: string;
  updatedAt: Date;
};

export function avatars(db: Db): Collection<Avatar> {
  return db.collection<Avatar>("avatars");
}

let avatarIndexesEnsured = false;

export async function ensureAvatarIndexes(db: Db) {
  if (avatarIndexesEnsured) return;

  await avatars(db).createIndex(
    { usernameLower: 1 },
    { unique: true, name: "avatar_usernameLower_unique" },
  );

  avatarIndexesEnsured = true;
}

export type Vibration = {
  fromUsernameLower: string;
  toUsernameLower: string;
  song: MusicPick;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  respondedAt: Date | null;
  senderReadAt: Date | null;
  recipientReadAt: Date | null;
};

export function vibrations(db: Db): Collection<Vibration> {
  return db.collection<Vibration>("vibrations");
}

let vibrationIndexesEnsured = false;

export async function ensureVibrationIndexes(db: Db) {
  if (vibrationIndexesEnsured) return;

  await vibrations(db).createIndex(
    { fromUsernameLower: 1, toUsernameLower: 1 },
    { unique: true, name: "vibration_pair_unique" },
  );

  vibrationIndexesEnsured = true;
}

export type Message = {
  pairKey: string;
  fromUsernameLower: string;
  body: string;
  createdAt: Date;
};

export function messages(db: Db): Collection<Message> {
  return db.collection<Message>("messages");
}

let messageIndexesEnsured = false;

export async function ensureMessageIndexes(db: Db) {
  if (messageIndexesEnsured) return;

  await messages(db).createIndex({ pairKey: 1, createdAt: 1 }, { name: "message_pair_created" });

  messageIndexesEnsured = true;
}
