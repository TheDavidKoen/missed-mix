import { ensureVibrationIndexes, profiles, vibrations, withDb } from "./mongo";
import type { MusicPick } from "./spotify";

export async function sendVibration(
  env: Env,
  fromUsernameLower: string,
  toUsernameLower: string,
  song: MusicPick,
) {
  if (fromUsernameLower === toUsernameLower) return "self" as const;

  return withDb(env, async (db) => {
    await ensureVibrationIndexes(db);

    const recipient = await profiles(db).findOne(
      { usernameLower: toUsernameLower },
      { projection: { _id: 1 } },
    );

    if (!recipient) return "no-such-profile" as const;

    /* The unique index on the pair is the guard, not a prior lookup: two rapid
       submits both pass a check-then-insert and only the index rejects the
       second. */
    try {
      await vibrations(db).insertOne({
        fromUsernameLower,
        toUsernameLower,
        song,
        status: "pending",
        createdAt: new Date(),
        respondedAt: null,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return "already-sent" as const;
      throw error;
    }

    return "sent" as const;
  });
}

export async function vibrationBetween(
  env: Env,
  fromUsernameLower: string,
  toUsernameLower: string,
) {
  return withDb(env, (db) =>
    vibrations(db).findOne(
      { fromUsernameLower, toUsernameLower },
      { projection: { _id: 0, status: 1, song: 1, createdAt: 1 } },
    ),
  );
}

export async function listReceived(env: Env, toUsernameLower: string) {
  return withDb(env, (db) =>
    vibrations(db)
      .find({ toUsernameLower }, { projection: { _id: 0 }, sort: { createdAt: -1 }, limit: 60 })
      .toArray(),
  );
}
