import { type Collection, type Db, MongoClient } from "mongodb";

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
