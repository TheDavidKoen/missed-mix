import { z } from "zod";

import { parseJson } from "./form";
import { ensureProfileIndexes, profiles, withDb } from "./mongo";
import { pickSchema } from "./spotify";

const pick = pickSchema.nullable();

export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Add your first name.")
    .max(40, "First names are at most 40 characters."),

  description: z.string().trim().max(200, "Keep your quote to 200 characters."),
  picks: z.object({
    childhood: pick,
    excited: pick,
    cloudy: pick,
    work: pick,
    topAlbum: pick,
    currentSong: pick,
  }),
});

type ProfileInput = z.infer<typeof profileSchema>;

export async function saveProfile(
  env: Env,
  usernameLower: string,
  input: ProfileInput,
  avatarUpdated: boolean,
) {
  const now = new Date();

  return withDb(env, async (db) => {
    await ensureProfileIndexes(db);

    return profiles(db).updateOne(
      { usernameLower },
      {
        $set: {
          ...input,
          updatedAt: now,
          ...(avatarUpdated ? { avatarUpdatedAt: now } : {}),
        },
        $setOnInsert: {
          usernameLower,
          createdAt: now,
          ...(avatarUpdated ? {} : { avatarUpdatedAt: null }),
        },
      },
      { upsert: true },
    );
  });
}

const PICK_KEYS = ["childhood", "excited", "cloudy", "work", "topAlbum", "currentSong"] as const;

export function parsePicks(form: FormData) {
  return Object.fromEntries(PICK_KEYS.map((key) => [key, parseJson(form.get(`pick.${key}`))]));
}

export async function listOtherProfiles(env: Env, usernameLower: string) {
  return withDb(env, (db) =>
    profiles(db)
      .find(
        { usernameLower: { $ne: usernameLower } },
        {
          projection: { _id: 0 },
          sort: { updatedAt: -1 },
          limit: 60,
        },
      )
      .toArray(),
  );
}

export async function readPublicProfile(env: Env, usernameLower: string) {
  return withDb(env, (db) => profiles(db).findOne({ usernameLower }, { projection: { _id: 0 } }));
}
