import { useEffect, useRef } from "react";
import { Form, redirect } from "react-router";

import { AvatarField } from "~/components/AvatarField";
import { Field } from "~/components/Field";
import { MusicPicker } from "~/components/MusicPicker";
import { PillButton } from "~/components/Pill";
import { Wordmark } from "~/components/Wordmark";
import type { PickKey } from "~/content";
import { PROFILE, PROMPTS, SITE } from "~/content";
import { storeAvatar } from "~/lib/avatar";
import { cloudflareContext } from "~/lib/context";
import { fieldErrorsFrom } from "~/lib/form";
import { parsePicks, profileSchema, readProfile, saveProfile } from "~/lib/profile";
import { currentUsername, endSession } from "~/lib/session";
import type { Route } from "./+types/profile";

export function meta() {
  return [{ title: `Profile | ${SITE.name}` }, { name: "robots", content: "noindex" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const username = await currentUsername(request, env);
  if (!username) throw redirect("/login");

  return { username, profile: await readProfile(env, username.toLowerCase()) };
}

export async function action({ request, context }: Route.ActionArgs) {
  const { env } = context.get(cloudflareContext);
  const username = await currentUsername(request, env);
  if (!username) throw redirect("/login");

  const form = await request.formData();
  if (form.get("logout") === "true") throw await endSession(request, env, "/");

  const avatar = form.get("avatar");
  let avatarError: string | null = null;
  let avatarUpdated = false;

  if (avatar instanceof File && avatar.size > 0) {
    const failure = await storeAvatar(env, username.toLowerCase(), avatar);

    if (failure === "too-large") avatarError = "That image is larger than 2 MB.";
    else if (failure === "not-an-image") avatarError = "That file is not a JPEG, PNG or WebP.";
    else avatarUpdated = true;
  }

  const parsed = profileSchema.safeParse({
    firstName: form.get("firstName"),
    description: form.get("description") ?? "",
    picks: parsePicks(form),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), avatarError, saved: false };
  }

  await saveProfile(env, username.toLowerCase(), parsed.data, avatarUpdated);
  return { fieldErrors: fieldErrorsFrom(null), avatarError, saved: true };
}

export default function Profile({ loaderData, actionData }: Route.ComponentProps) {
  const { username, profile } = loaderData;
  const errors = actionData?.fieldErrors ?? {};
  const pickOf = (key: PickKey) => profile?.picks?.[key] ?? null;

  const savedRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!actionData?.saved) return;

    savedRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
  }, [actionData]);

  const featured = PROMPTS.filter((prompt) => prompt.kind !== "artist");
  const artists = PROMPTS.filter((prompt) => prompt.kind === "artist");
  const avatarSrc = profile?.avatarUpdatedAt
    ? `/avatar/${username}?v=${new Date(profile.avatarUpdatedAt).getTime()}`
    : null;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-6 py-12">
      <header className="flex items-center justify-between">
        <Wordmark className="text-xl" />
        <Form method="post">
          <input type="hidden" name="logout" value="true" />
          <PillButton type="submit" variant="secondary" className="px-6 py-2 text-sm">
            Log out
          </PillButton>
        </Form>
      </header>

      <h1 className="mt-10 text-4xl font-black tracking-tight">{PROFILE.heading}</h1>

      {actionData?.saved ? (
        <p
          ref={savedRef}
          role="status"
          className="mt-6 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-on-accent"
        >
          {PROFILE.saved}
        </p>
      ) : null}

      {errors.picks ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-line bg-raised px-4 py-3 text-sm text-danger"
        >
          One of your picks could not be saved. Choose it again from the search results.
        </p>
      ) : null}

      <Form method="post" encType="multipart/form-data" className="mt-8 flex flex-col gap-8">
        <div className="flex flex-col gap-5 rounded-3xl bg-surface p-6 sm:p-8">
          <div>
            <p className="text-sm text-muted">Signed in as</p>
            <p className="text-2xl font-black tracking-tight">{username}</p>
          </div>

          <AvatarField
            label={PROFILE.avatar}
            hint={PROFILE.avatarHint}
            error={actionData?.avatarError}
            saved={avatarSrc}
          />

          <Field
            name="firstName"
            label={PROFILE.firstName}
            maxLength={40}
            defaultValue={profile?.firstName ?? ""}
            error={errors.firstName}
          />

          <Field
            name="description"
            label={PROFILE.description}
            multiline
            required={false}
            maxLength={200}
            defaultValue={profile?.description ?? ""}
            hint={PROFILE.descriptionHint}
            error={errors.description}
          />
        </div>

        <section>
          <h2 className="text-lg font-black tracking-tight">{PROFILE.featuredHeading}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {featured.map((prompt) => (
              <MusicPicker
                key={prompt.key}
                name={`pick.${prompt.key}`}
                kind={prompt.kind}
                label={prompt.label}
                initial={pickOf(prompt.key)}
                featured
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black tracking-tight">{PROFILE.promptsHeading}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {artists.map((prompt) => (
              <MusicPicker
                key={prompt.key}
                name={`pick.${prompt.key}`}
                kind={prompt.kind}
                label={prompt.label}
                initial={pickOf(prompt.key)}
              />
            ))}
          </div>
        </section>

        <PillButton type="submit" className="self-start">
          {PROFILE.save}
        </PillButton>
      </Form>
    </div>
  );
}
