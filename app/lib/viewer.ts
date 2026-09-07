/* viewer.ts — One database read for the signed-in layout. readViewer returns the
   viewer's profile and unread count together, so the child routes need no query of their
   own. */

import { profiles, withDb } from "./mongo";
import { unreadFor } from "./vibrations";

export async function readViewer(env: Env, usernameLower: string) {
  return withDb(env, async (db) => {
    const [profile, unread] = await Promise.all([
      profiles(db).findOne({ usernameLower }),
      unreadFor(db, usernameLower),
    ]);

    return { profile, unread };
  });
}
