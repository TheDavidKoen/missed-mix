import { Link, redirect } from "react-router";

import { PickTile } from "~/components/PickTile";
import { PillLink } from "~/components/Pill";
import { VibrationPanel } from "~/components/VibrationPanel";
import { PROMPTS, SITE, VIBRATION } from "~/content";
import { cloudflareContext } from "~/lib/context";
import { readPublicProfile } from "~/lib/profile";
import { currentUsername } from "~/lib/session";
import { pickSchema } from "~/lib/spotify";
import { acceptVibration, sendVibration, vibrationsWith } from "~/lib/vibrations";
import type { Route } from "./+types/mixers.$username";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `${params.username} | ${SITE.name}` }, { name: "robots", content: "noindex" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const username = await currentUsername(request, env);
  if (!username) throw redirect("/login");

  const target = params.username.toLowerCase();
  if (target === username.toLowerCase()) throw redirect("/profile");

  const profile = await readPublicProfile(env, target);
  if (!profile) throw new Response("Not found", { status: 404 });

  const { sent, received } = await vibrationsWith(env, username.toLowerCase(), target);
  return { profile, sent, received };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const { env } = context.get(cloudflareContext);
  const username = await currentUsername(request, env);
  if (!username) throw redirect("/login");

  const form = await request.formData();
  const target = params.username.toLowerCase();

  if (form.get("intent") === "accept") {
    const outcome = await acceptVibration(env, username.toLowerCase(), target);
    return outcome === "accepted"
      ? { error: null }
      : { error: "That vibration is no longer waiting." };
  }

  const raw = form.get("song");
  if (typeof raw !== "string" || raw === "") return { error: VIBRATION.needSong };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: VIBRATION.needSong };
  }

  const song = pickSchema.safeParse(parsed);
  if (!song.success) return { error: VIBRATION.needSong };

  const outcome = await sendVibration(env, username.toLowerCase(), target, song.data);

  if (outcome === "already-sent") return { error: VIBRATION.already };
  if (outcome !== "sent") return { error: "That profile is no longer available." };

  return { error: null };
}

export default function MixerProfile({ loaderData, actionData }: Route.ComponentProps) {
  const { profile, sent, received } = loaderData;
  const featured = PROMPTS.filter((prompt) => prompt.kind !== "artist");
  const artists = PROMPTS.filter((prompt) => prompt.kind === "artist");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-16">
      <PillLink to="/mixers" variant="secondary" className="px-5 py-2 text-sm">
        Back to Mixers
      </PillLink>

      <div className="mt-8 flex items-start gap-4 sm:gap-6">
        {profile.avatarUpdatedAt ? (
          <img
            src={`/avatar/${profile.usernameLower}?v=${new Date(profile.avatarUpdatedAt).getTime()}`}
            alt=""
            className="size-20 shrink-0 rounded-full object-cover sm:size-28"
          />
        ) : (
          <span className="size-20 shrink-0 rounded-full bg-raised sm:size-28" />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{profile.firstName}</h1>
          <p className="truncate text-muted">{profile.usernameLower}</p>
          {profile.description ? (
            <p className="mt-4 text-balance text-ink">{profile.description}</p>
          ) : null}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-black tracking-tight">Their two highlights</h2>
        <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
          {featured.map((prompt) => (
            <PickTile
              key={prompt.key}
              label={prompt.label}
              pick={profile.picks?.[prompt.key]}
              big
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-black tracking-tight">Four artists</h2>
        <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
          {artists.map((prompt) => (
            <PickTile key={prompt.key} label={prompt.label} pick={profile.picks?.[prompt.key]} />
          ))}
        </div>
      </section>

      <VibrationPanel
        username={profile.usernameLower}
        sent={sent}
        received={received}
        error={actionData?.error}
      />
    </main>
  );
}

export function ErrorBoundary() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-16 text-center">
      <h1 className="text-3xl font-black tracking-tight">No such profile</h1>
      <p className="mt-3 text-muted">That person is not on Missed Mix.</p>
      <Link to="/mixers" className="mt-6 inline-block text-accent underline underline-offset-4">
        Back to Mixers
      </Link>
    </main>
  );
}
