import { useEffect, useRef } from "react";
import { Form, Link, redirect, useRevalidator } from "react-router";

import { PillButton, PillLink } from "~/components/Pill";
import { SITE, VIBRATION } from "~/content";
import { cloudflareContext } from "~/lib/context";
import { currentUsername } from "~/lib/session";
import { conversation, postMessage } from "~/lib/vibrations";
import type { Route } from "./+types/vibrations.$username";

const MAX_BODY = 1000;
const POLL_MS = 5000;

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `${params.username} | ${SITE.name}` }, { name: "robots", content: "noindex" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const username = await currentUsername(request, env);
  if (!username) throw redirect("/login");

  const other = params.username.toLowerCase();
  const found = await conversation(env, username.toLowerCase(), other);
  if (!found) throw new Response("Not found", { status: 404 });

  return { me: username.toLowerCase(), other, thread: found.thread, song: found.vibration.song };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const { env } = context.get(cloudflareContext);
  const username = await currentUsername(request, env);
  if (!username) throw redirect("/login");

  const body = String((await request.formData()).get("body") ?? "").trim();
  if (!body) return { error: "Write something first." };
  if (body.length > MAX_BODY) return { error: "That message is too long." };

  const outcome = await postMessage(
    env,
    username.toLowerCase(),
    params.username.toLowerCase(),
    body,
  );
  if (outcome !== "posted") return { error: "This conversation is not open." };

  return { error: null };
}

export default function Conversation({ loaderData, actionData }: Route.ComponentProps) {
  const { me, other, thread, song } = loaderData;
  const revalidator = useRevalidator();
  const endRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  /* Messages arrive by polling rather than a socket. Durable Objects would be the
     realtime answer and are the stage 8 plan; this keeps the conversation usable
     without another binding. */
  useEffect(() => {
    const timer = setInterval(() => {
      if (revalidator.state === "idle") revalidator.revalidate();
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [revalidator]);

  useEffect(() => {
    if (thread.length === 0) return;
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length]);

  useEffect(() => {
    if (actionData?.error === null) formRef.current?.reset();
  }, [actionData]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-6 pb-16">
      <PillLink to="/vibrations" variant="secondary" className="self-start px-5 py-2 text-sm">
        Back to Vibrations
      </PillLink>

      <div className="mt-8 flex items-center gap-4 rounded-3xl bg-surface p-5">
        {song.image ? (
          <img
            src={song.image}
            alt=""
            className="size-14 shrink-0 rounded-xl object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="min-w-0">
          <Link
            to={`/mixers/${other}`}
            className="block truncate text-lg font-black tracking-tight underline-offset-4 hover:underline"
          >
            {other}
          </Link>
          <p className="truncate text-xs text-muted">
            {song.name} · {song.artist}
          </p>
        </div>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {thread.map((message) => {
          const mine = message.fromUsernameLower === me;

          return (
            <li
              key={`${message.createdAt}-${message.fromUsernameLower}`}
              className={mine ? "self-end" : "self-start"}
            >
              <p
                className={`max-w-md text-balance rounded-2xl px-4 py-3 text-sm ${
                  mine ? "bg-accent text-on-accent" : "bg-raised text-ink"
                }`}
              >
                {message.body}
              </p>
            </li>
          );
        })}
      </ul>
      <div ref={endRef} />

      {thread.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-raised p-6 text-sm text-muted">
          No messages yet. Say something.
        </p>
      ) : null}

      {actionData?.error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {actionData.error}
        </p>
      ) : null}

      <Form ref={formRef} method="post" className="mt-6 flex gap-3">
        <input
          name="body"
          type="text"
          required
          maxLength={MAX_BODY}
          autoComplete="off"
          placeholder={VIBRATION.messagePlaceholder}
          className="flex-1 rounded-pill border border-line bg-raised px-5 py-3 text-ink placeholder:text-muted"
        />
        <PillButton type="submit">{VIBRATION.messageSubmit}</PillButton>
      </Form>
    </main>
  );
}

export function ErrorBoundary() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 pb-16 text-center">
      <h1 className="text-3xl font-black tracking-tight">No conversation</h1>
      <p className="mt-3 text-muted">
        A conversation opens once one of you accepts the other's vibration.
      </p>
      <Link to="/vibrations" className="mt-6 inline-block text-accent underline underline-offset-4">
        Back to Vibrations
      </Link>
    </main>
  );
}
