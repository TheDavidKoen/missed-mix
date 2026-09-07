/* avatar.$username.tsx — Serves an avatar's bytes to signed-in viewers only. */

import { readAvatar } from "~/lib/avatar";
import { cloudflareContext } from "~/lib/context";
import { currentUsername } from "~/lib/session";
import type { Route } from "./+types/avatar.$username";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);

  if (!(await currentUsername(request, env))) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const avatar = await readAvatar(env, params.username.toLowerCase());
  if (!avatar) throw new Response("Not found", { status: 404 });

  return new Response(avatar.bytes, {
    headers: {
      "Content-Type": avatar.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
