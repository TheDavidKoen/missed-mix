import type { Collection, Db } from "mongodb";

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
