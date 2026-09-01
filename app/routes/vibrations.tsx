import { Link, redirect } from "react-router";

import { SITE, VIBRATION } from "~/content";
import { cloudflareContext } from "~/lib/context";
import { currentUsername } from "~/lib/session";
import { listReceived } from "~/lib/vibrations";
import type { Route } from "./+types/vibrations";

export function meta() {
  return [{ title: `Vibrations | ${SITE.name}` }, { name: "robots", content: "noindex" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const username = await currentUsername(request, env);
  if (!username) throw redirect("/login");

  return { received: await listReceived(env, username.toLowerCase()) };
}

export default function Vibrations({ loaderData }: Route.ComponentProps) {
  const { received } = loaderData;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-16">
      <h1 className="text-4xl font-black tracking-tight">{VIBRATION.heading}</h1>
      <p className="mt-3 text-muted">{VIBRATION.standfirst}</p>

      {received.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-raised p-6 text-sm text-muted">{VIBRATION.empty}</p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {received.map((vibration) => (
            <li
              key={`${vibration.fromUsernameLower}-${vibration.createdAt}`}
              className="rounded-3xl bg-surface p-6"
            >
              <div className="flex items-center gap-4">
                {vibration.song.image ? (
                  <img
                    src={vibration.song.image}
                    alt=""
                    className="size-16 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="size-16 shrink-0 rounded-xl bg-raised" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-black tracking-tight">
                    {vibration.fromUsernameLower}
                  </p>
                  <p className="truncate text-sm text-ink">{vibration.song.name}</p>
                  <p className="truncate text-xs text-muted">{vibration.song.artist}</p>
                </div>

                <Link
                  to={`/mixers/${vibration.fromUsernameLower}`}
                  className="shrink-0 rounded-pill border border-line px-5 py-2 text-sm font-bold hover:border-ink"
                >
                  View profile
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
