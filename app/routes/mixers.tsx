import { Link, redirect } from "react-router";

import { MIXERS, SITE } from "~/content";
import { cloudflareContext } from "~/lib/context";
import { listOtherProfiles } from "~/lib/profile";
import { currentUsername } from "~/lib/session";
import type { Route } from "./+types/mixers";

export function meta() {
  return [{ title: `Mixers | ${SITE.name}` }, { name: "robots", content: "noindex" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const username = await currentUsername(request, env);
  if (!username) throw redirect("/login");

  return { profiles: await listOtherProfiles(env, username.toLowerCase()) };
}

export default function Mixers({ loaderData }: Route.ComponentProps) {
  const { profiles } = loaderData;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-16">
      <h1 className="text-4xl font-black tracking-tight">{MIXERS.heading}</h1>
      <p className="mt-3 text-muted">{MIXERS.standfirst}</p>

      {profiles.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-raised p-6 text-sm text-muted">{MIXERS.empty}</p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {profiles.map((profile) => {
            const song = profile.picks?.currentSong ?? null;

            return (
              <li key={profile.usernameLower}>
                <Link
                  to={`/mixers/${profile.usernameLower}`}
                  className="flex h-full items-center gap-4 rounded-3xl bg-surface p-5 transition-colors hover:bg-raised-hover"
                >
                  {profile.avatarUpdatedAt ? (
                    <img
                      src={`/avatar/${profile.usernameLower}?v=${new Date(profile.avatarUpdatedAt).getTime()}`}
                      alt=""
                      className="size-16 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="size-16 shrink-0 rounded-full bg-raised" />
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-black tracking-tight">
                      {profile.usernameLower}
                    </span>

                    {song ? (
                      <span className="mt-2 flex items-center gap-2">
                        {song.image ? (
                          <img
                            src={song.image}
                            alt=""
                            className="size-8 shrink-0 rounded object-cover"
                            loading="lazy"
                          />
                        ) : null}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">{song.name}</span>
                          <span className="block truncate text-xs text-muted">{song.artist}</span>
                        </span>
                      </span>
                    ) : (
                      <span className="mt-2 block text-xs text-muted">{MIXERS.noSong}</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
