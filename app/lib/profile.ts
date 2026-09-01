import { z } from "zod";

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

export type ProfileInput = z.infer<typeof profileSchema>;

export async function readProfile(env: Env, usernameLower: string) {
  return withDb(env, (db) => profiles(db).findOne({ usernameLower }));
}

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
        $setOnInsert: { usernameLower, createdAt: now },
      },
      { upsert: true },
    );
  });
}

const PICK_KEYS = ["childhood", "excited", "cloudy", "work", "topAlbum", "currentSong"] as const;

export function parsePicks(form: FormData) {
  const picks: Record<string, unknown> = {};

  for (const key of PICK_KEYS) {
    const raw = form.get(`pick.${key}`);
    if (typeof raw !== "string" || raw === "") {
      picks[key] = null;
      continue;
    }

    try {
      picks[key] = JSON.parse(raw);
    } catch {
      picks[key] = null;
    }
  }

  return picks;
}
