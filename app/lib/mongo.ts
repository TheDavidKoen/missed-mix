/* mongo.ts — MongoDB access. beginDbSession and runInDbSession give a request one shared
   connection, withDb hands that connection to a caller, and each ensure*Indexes asserts
   the unique index its write path depends on. */

import { AsyncLocalStorage } from "node:async_hooks";
import type { Binary, Collection, Db, MongoClient } from "mongodb";

import type { PickKey } from "~/content";
import type { MusicPick } from "./spotify";

type Account = {
  username: string;
  usernameLower: string;
  passwordHash: string;
  createdAt: Date;
};

class DbSession {
  private client: MongoClient | null = null;
  private opening: Promise<Db> | null = null;

  constructor(private readonly env: Env) {}

  db(): Promise<Db> {
    this.opening ??= (async () => {
      const { MongoClient } = await import("mongodb");

      const client = new MongoClient(this.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5_000,
        connectTimeoutMS: 5_000,
      });

      await client.connect();
      this.client = client;

      return client.db(this.env.MONGODB_DB);
    })();

    return this.opening;
  }

  async close() {
    if (!this.opening) return;

    try {
      await this.opening;
    } catch {}

    await this.client?.close();
  }
}

const sessions = new AsyncLocalStorage<DbSession>();

export function beginDbSession(env: Env) {
  return new DbSession(env);
}

export function runInDbSession<T>(session: DbSession, run: () => Promise<T>) {
  return sessions.run(session, run);
}

export async function withDb<T>(env: Env, run: (db: Db) => Promise<T>): Promise<T> {
  const session = sessions.getStore();
  if (session) return run(await session.db());

  const standalone = new DbSession(env);

  try {
    return await run(await standalone.db());
  } finally {
    await standalone.close();
  }
}

export function accounts(db: Db): Collection<Account> {
  return db.collection<Account>("accounts");
}

let accountIndexesEnsured = false;

export async function ensureAccountIndexes(db: Db) {
  if (accountIndexesEnsured) return;

  await accounts(db).createIndex(
    { usernameLower: 1 },
    { unique: true, name: "usernameLower_unique" },
  );

  accountIndexesEnsured = true;
}

type Profile = {
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

type Avatar = {
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

type Vibration = {
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

  await vibrations(db).createIndex(
    { toUsernameLower: 1, status: 1 },
    { name: "vibration_recipient_status" },
  );

  vibrationIndexesEnsured = true;
}

type Message = {
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
