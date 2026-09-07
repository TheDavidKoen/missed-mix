/* init-db.mjs — Creates the indexes a new cluster needs. Run once, with pnpm run
   init-db. */

import { setServers } from "node:dns";
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const vars = Object.fromEntries(
  readFileSync(".dev.vars", "utf8")
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [
        key.trim(),
        rest
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, ""),
      ];
    }),
);

if (vars.DNS_SERVERS) {
  setServers(vars.DNS_SERVERS.split(",").map((server) => server.trim()));
}

const client = new MongoClient(vars.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

try {
  await client.connect();
  const db = client.db(vars.MONGODB_DB);

  const name = await db
    .collection("accounts")
    .createIndex({ usernameLower: 1 }, { unique: true, name: "usernameLower_unique" });

  const profileIndex = await db
    .collection("profiles")
    .createIndex({ usernameLower: 1 }, { unique: true, name: "profile_usernameLower_unique" });

  const avatarIndex = await db
    .collection("avatars")
    .createIndex({ usernameLower: 1 }, { unique: true, name: "avatar_usernameLower_unique" });

  const vibrationIndex = await db
    .collection("vibrations")
    .createIndex(
      { fromUsernameLower: 1, toUsernameLower: 1 },
      { unique: true, name: "vibration_pair_unique" },
    );

  const messageIndex = await db
    .collection("messages")
    .createIndex({ pairKey: 1, createdAt: 1 }, { name: "message_pair_created" });

  console.log(`Connected to ${vars.MONGODB_DB}`);
  console.log(
    `Indexes ready: ${name}, ${profileIndex}, ${avatarIndex}, ${vibrationIndex}, ${messageIndex}`,
  );
  console.log(`Accounts: ${await db.collection("accounts").countDocuments()}`);
} catch (error) {
  if (error.code === "ECONNREFUSED" && error.syscall === "querySrv") {
    console.error("SRV lookup refused. Set DNS_SERVERS in .dev.vars to a working resolver.");
  }

  throw error;
} finally {
  await client.close();
}
