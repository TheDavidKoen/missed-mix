import type { Db } from "mongodb";
import {
  ensureMessageIndexes,
  ensureVibrationIndexes,
  messages,
  profiles,
  vibrations,
  withDb,
} from "./mongo";
import type { MusicPick } from "./spotify";

/* Both directions of a conversation have to resolve to one key, so it is sorted
   rather than concatenated in submission order. */
export function pairKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

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

    try {
      await vibrations(db).insertOne({
        fromUsernameLower,
        toUsernameLower,
        song,
        status: "pending",
        createdAt: new Date(),
        respondedAt: null,
        senderReadAt: new Date(),
        recipientReadAt: null,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return "already-sent" as const;
      throw error;
    }

    return "sent" as const;
  });
}

export async function acceptVibration(env: Env, meLower: string, senderLower: string) {
  return withDb(env, async (db) => {
    const result = await vibrations(db).updateOne(
      { fromUsernameLower: senderLower, toUsernameLower: meLower, status: "pending" },
      { $set: { status: "accepted", respondedAt: new Date(), recipientReadAt: new Date() } },
    );

    return result.matchedCount === 1 ? ("accepted" as const) : ("not-pending" as const);
  });
}

export async function vibrationsWith(env: Env, meLower: string, otherLower: string) {
  return withDb(env, async (db) => {
    const [sent, received] = await Promise.all([
      vibrations(db).findOne(
        { fromUsernameLower: meLower, toUsernameLower: otherLower },
        { projection: { _id: 0 } },
      ),
      vibrations(db).findOne(
        { fromUsernameLower: otherLower, toUsernameLower: meLower },
        { projection: { _id: 0 } },
      ),
    ]);

    /* Opening the sender's profile is one of the two ways a recipient acts on a
       vibration, so it clears the badge here as well as in the conversation. */
    if (received && received.recipientReadAt === null) {
      await vibrations(db).updateOne(
        { fromUsernameLower: otherLower, toUsernameLower: meLower },
        { $set: { recipientReadAt: new Date() } },
      );
    }

    return { sent, received };
  });
}

export async function listVibrations(env: Env, meLower: string) {
  return withDb(env, (db) =>
    vibrations(db)
      .find(
        { $or: [{ toUsernameLower: meLower }, { fromUsernameLower: meLower, status: "accepted" }] },
        { projection: { _id: 0 }, sort: { createdAt: -1 }, limit: 60 },
      )
      .toArray(),
  );
}

export async function unreadFor(db: Db, meLower: string) {
  const mine = await vibrations(db)
    .find(
      { $or: [{ toUsernameLower: meLower }, { fromUsernameLower: meLower }] },
      { projection: { _id: 0 } },
    )
    .toArray();

  const pending = mine.filter(
    (entry) =>
      entry.toUsernameLower === meLower &&
      entry.status === "pending" &&
      entry.recipientReadAt === null,
  ).length;

  const conditions = mine
    .filter((entry) => entry.status === "accepted")
    .map((entry) => {
      const iAmSender = entry.fromUsernameLower === meLower;
      const other = iAmSender ? entry.toUsernameLower : entry.fromUsernameLower;
      const since = (iAmSender ? entry.senderReadAt : entry.recipientReadAt) ?? new Date(0);

      return {
        pairKey: pairKey(meLower, other),
        fromUsernameLower: { $ne: meLower },
        createdAt: { $gt: since },
      };
    });

  const unreadMessages = conditions.length
    ? await messages(db).countDocuments({ $or: conditions })
    : 0;

  return pending + unreadMessages;
}

function acceptedPair(meLower: string, otherLower: string) {
  return {
    status: "accepted" as const,
    $or: [
      { fromUsernameLower: meLower, toUsernameLower: otherLower },
      { fromUsernameLower: otherLower, toUsernameLower: meLower },
    ],
  };
}

export async function conversation(env: Env, meLower: string, otherLower: string) {
  return withDb(env, async (db) => {
    await ensureMessageIndexes(db);

    const vibration = await vibrations(db).findOne(acceptedPair(meLower, otherLower), {
      projection: { _id: 0 },
    });

    if (!vibration) return null;

    const thread = await messages(db)
      .find(
        { pairKey: pairKey(meLower, otherLower) },
        { projection: { _id: 0 }, sort: { createdAt: 1 }, limit: 200 },
      )
      .toArray();

    /* Opening the room is what clears the badge, so the marker moves here rather
       than when a message is sent. */
    const field = vibration.fromUsernameLower === meLower ? "senderReadAt" : "recipientReadAt";
    await vibrations(db).updateOne(
      {
        fromUsernameLower: vibration.fromUsernameLower,
        toUsernameLower: vibration.toUsernameLower,
      },
      { $set: { [field]: new Date() } },
    );

    return { vibration, thread };
  });
}

export async function postMessage(env: Env, meLower: string, otherLower: string, body: string) {
  return withDb(env, async (db) => {
    await ensureMessageIndexes(db);

    const allowed = await vibrations(db).findOne(acceptedPair(meLower, otherLower), {
      projection: { _id: 1 },
    });

    if (!allowed) return "not-allowed" as const;

    await messages(db).insertOne({
      pairKey: pairKey(meLower, otherLower),
      fromUsernameLower: meLower,
      body,
      createdAt: new Date(),
    });

    return "posted" as const;
  });
}
