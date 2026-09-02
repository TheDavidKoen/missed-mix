import { Form, Link, redirect } from "react-router";

import { MusicPicker } from "~/components/MusicPicker";
import { PillButton, PillLink } from "~/components/Pill";
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
  const alreadySent = sent !== null;
  const waiting = received?.status === "pending";
  const open = received?.status === "accepted" || sent?.status === "accepted";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-16">
      <PillLink to="/mixers" variant="secondary" className="px-5 py-2 text-sm">
        Back to Mixers
      </PillLink>

      <div className="mt-8 flex items-start gap-6">
        {profile.avatarUpdatedAt ? (
          <img
            src={`/avatar/${profile.usernameLower}?v=${new Date(profile.avatarUpdatedAt).getTime()}`}
            alt=""
            className="size-28 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="size-28 shrink-0 rounded-full bg-raised" />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-4xl font-black tracking-tight">{profile.firstName}</h1>
          <p className="text-muted">{profile.usernameLower}</p>
          {profile.description ? (
            <p className="mt-4 text-balance text-ink">{profile.description}</p>
          ) : null}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-black tracking-tight">Their two highlights</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {artists.map((prompt) => (
            <PickTile key={prompt.key} label={prompt.label} pick={profile.picks?.[prompt.key]} />
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl bg-surface p-6 sm:p-8">
        {open ? (
          <>
            <h2 className="text-lg font-black tracking-tight">{VIBRATION.accepted}</h2>
            <PillLink to={`/vibrations/${profile.usernameLower}`} className="mt-5">
              {VIBRATION.openChat}
            </PillLink>
          </>
        ) : waiting ? (
          <>
            <h2 className="text-lg font-black tracking-tight">{VIBRATION.accept}</h2>
            <p className="mt-2 text-sm text-muted">{VIBRATION.acceptHint}</p>

            {received?.song ? (
              <div className="mt-5 flex items-center gap-4 rounded-2xl bg-raised p-4">
                {received.song.image ? (
                  <img
                    src={received.song.image}
                    alt=""
                    className="size-16 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate font-bold">{received.song.name}</p>
                  <p className="truncate text-sm text-muted">{received.song.artist}</p>
                </div>
              </div>
            ) : null}

            {actionData?.error ? (
              <p role="alert" className="mt-4 text-sm text-danger">
                {actionData.error}
              </p>
            ) : null}

            <Form method="post" className="mt-5">
              <input type="hidden" name="intent" value="accept" />
              <PillButton type="submit">{VIBRATION.accept}</PillButton>
            </Form>
          </>
        ) : alreadySent ? (
          <>
            <h2 className="text-lg font-black tracking-tight">{VIBRATION.send}</h2>
            <p
              role="status"
              className="mt-4 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-on-accent"
            >
              {VIBRATION.sent}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-black tracking-tight">{VIBRATION.send}</h2>
            <p className="mt-2 text-sm text-muted">{VIBRATION.hint}</p>

            {actionData?.error ? (
              <p role="alert" className="mt-4 text-sm text-danger">
                {actionData.error}
              </p>
            ) : null}

            <Form method="post" className="mt-5 flex flex-col gap-4">
              <MusicPicker name="song" kind="track" label={VIBRATION.prompt} initial={null} />
              <PillButton type="submit" className="self-start">
                {VIBRATION.submit}
              </PillButton>
            </Form>
          </>
        )}
      </section>
    </main>
  );
}

function PickTile({
  label,
  pick,
  big = false,
}: {
  label: string;
  pick: { name: string; artist: string | null; image: string | null } | null | undefined;
  big?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-raised p-5">
      <p className={`font-bold tracking-tight ${big ? "text-base" : "text-sm"}`}>{label}</p>

      {pick ? (
        <div className="mt-4 flex items-center gap-4">
          {pick.image ? (
            <img
              src={pick.image}
              alt=""
              className={`${big ? "size-20 sm:size-24" : "size-12"} shrink-0 rounded-xl object-cover`}
              loading="lazy"
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-bold">{pick.name}</p>
            {pick.artist ? <p className="truncate text-sm text-muted">{pick.artist}</p> : null}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Not answered.</p>
      )}
    </div>
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
