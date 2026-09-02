import { profiles, withDb } from "./mongo";
import { unreadFor } from "./vibrations";

export async function readShell(env: Env, usernameLower: string) {
  return withDb(env, async (db) => {
    const [profile, unread] = await Promise.all([
      profiles(db).findOne({ usernameLower }),
      unreadFor(db, usernameLower),
    ]);

    return { profile, unread };
  });
}
