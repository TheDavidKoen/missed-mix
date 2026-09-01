import { cloudflareContext } from "~/lib/context";
import { limitKey, SEARCH_REQUESTS, tooManyAttempts } from "~/lib/rate-limit";
import { currentUsername } from "~/lib/session";
import { pickKindSchema, search } from "~/lib/spotify";
import type { Route } from "./+types/api.search";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);

  if (!(await currentUsername(request, env))) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (tooManyAttempts(limitKey(request, "search"), SEARCH_REQUESTS)) {
    throw new Response("Too many requests", { status: 429 });
  }

  const url = new URL(request.url);
  const kind = pickKindSchema.safeParse(url.searchParams.get("kind"));
  const query = (url.searchParams.get("q") ?? "").trim();

  if (!kind.success || query.length < 2) return { results: [] };

  return { results: await search(env, kind.data, query.slice(0, 100)) };
}
