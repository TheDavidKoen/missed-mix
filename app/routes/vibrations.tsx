import { Link, redirect } from "react-router";

import { SITE, VIBRATION } from "~/content";
import { cloudflareContext } from "~/lib/context";
import { currentUsername } from "~/lib/session";
import { listVibrations } from "~/lib/vibrations";
import type { Route } from "./+types/vibrations";

export function meta() {
  return [{ title: `Vibrations | ${SITE.name}` }, { name: "robots", content: "noindex" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const username = await currentUsername(request, env);
  if (!username) throw redirect("/login");

  const me = username.toLowerCase();
  const all = await listVibrations(env, me);

  return {
    me,
    waiting: all.filter((entry) => entry.status === "pending" && entry.toUsernameLower === me),
    open: all.filter((entry) => entry.status === "accepted"),
  };
}

export default function Vibrations({ loaderData }: Route.ComponentProps) {
  const { me, waiting, open } = loaderData;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-16">
      <h1 className="text-4xl font-black tracking-tight">{VIBRATION.heading}</h1>
      <p className="mt-3 text-muted">{VIBRATION.standfirst}</p>

      {waiting.length === 0 && open.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-raised p-6 text-sm text-muted">{VIBRATION.empty}</p>
      ) : null}

      {waiting.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-black tracking-tight">{VIBRATION.pendingHeading}</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {waiting.map((entry) => (
              <li key={entry.fromUsernameLower} className="rounded-3xl bg-surface p-6">
                <div className="flex items-center gap-4">
                  {entry.song.image ? (
                    <img
                      src={entry.song.image}
                      alt=""
                      className="size-16 shrink-0 rounded-xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="size-16 shrink-0 rounded-xl bg-raised" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black tracking-tight">{entry.fromUsernameLower}</p>
                    <p className="truncate text-sm text-ink">{entry.song.name}</p>
                    <p className="truncate text-xs text-muted">{entry.song.artist}</p>
                  </div>

                  <Link
                    to={`/mixers/${entry.fromUsernameLower}`}
                    className="shrink-0 rounded-pill border border-line px-5 py-2 text-sm font-bold hover:border-ink"
                  >
                    View profile
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {open.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-black tracking-tight">{VIBRATION.openHeading}</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {open.map((entry) => {
              const other =
                entry.fromUsernameLower === me ? entry.toUsernameLower : entry.fromUsernameLower;

              return (
                <li key={other}>
                  <Link
                    to={`/vibrations/${other}`}
                    className="flex items-center gap-4 rounded-3xl bg-surface p-5 transition-colors hover:bg-raised-hover"
                  >
                    {entry.song.image ? (
                      <img
                        src={entry.song.image}
                        alt=""
                        className="size-12 shrink-0 rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="size-12 shrink-0 rounded-xl bg-raised" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-black tracking-tight">{other}</span>
                      <span className="block truncate text-xs text-muted">
                        {entry.song.name} · {entry.song.artist}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
