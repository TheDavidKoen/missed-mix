import { readAvatar } from "~/lib/avatar";
import { cloudflareContext } from "~/lib/context";
import { currentUsername } from "~/lib/session";
import type { Route } from "./+types/avatar.$username";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);

  if (!(await currentUsername(request, env))) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const object = await readAvatar(env, params.username.toLowerCase());
  if (!object) throw new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=60, must-revalidate",
      ETag: object.httpEtag,
    },
  });
}
