import { Form } from "react-router";

import { MusicPicker } from "~/components/MusicPicker";
import { PillButton, PillLink } from "~/components/Pill";
import { VIBRATION } from "~/content";
import type { MusicPick } from "~/lib/spotify";

type Vibe = { status: "pending" | "accepted" | "declined"; song: MusicPick } | null;

/* Four states, and only one of them is reachable at a time: the pair already has
   a conversation, they are waiting on this user to accept, this user has sent one
   and is waiting, or neither has happened yet. The order below is the order they
   take precedence in, because an accepted pair also has a sent record. */
export function VibrationPanel({
  username,
  sent,
  received,
  error,
}: {
  username: string;
  sent: Vibe;
  received: Vibe;
  error?: string | null;
}) {
  const open = received?.status === "accepted" || sent?.status === "accepted";
  const waiting = received?.status === "pending";

  const alert = error ? (
    <p role="alert" className="mt-4 text-sm text-danger">
      {error}
    </p>
  ) : null;

  return (
    <section className="mt-12 rounded-3xl bg-surface p-6 sm:p-8">
      {open ? (
        <>
          <h2 className="text-lg font-black tracking-tight">{VIBRATION.accepted}</h2>
          <PillLink to={`/vibrations/${username}`} className="mt-5">
            {VIBRATION.openChat}
          </PillLink>
        </>
      ) : waiting ? (
        <>
          <h2 className="text-lg font-black tracking-tight">{VIBRATION.accept}</h2>
          <p className="mt-2 text-sm text-muted">{VIBRATION.acceptHint}</p>

          {received?.song ? (
            <div className="mt-5 flex min-w-0 items-center gap-3 rounded-2xl bg-raised p-4 sm:gap-4">
              {received.song.image ? (
                <img
                  src={received.song.image}
                  alt=""
                  className="size-16 shrink-0 rounded-xl object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{received.song.name}</p>
                <p className="truncate text-sm text-muted">{received.song.artist}</p>
              </div>
            </div>
          ) : null}

          {alert}

          <Form method="post" className="mt-5">
            <input type="hidden" name="intent" value="accept" />
            <PillButton type="submit">{VIBRATION.accept}</PillButton>
          </Form>
        </>
      ) : sent ? (
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

          {alert}

          <Form method="post" className="mt-5 flex flex-col gap-4">
            <MusicPicker name="song" kind="track" label={VIBRATION.prompt} initial={null} />
            <PillButton type="submit" className="self-start">
              {VIBRATION.submit}
            </PillButton>
          </Form>
        </>
      )}
    </section>
  );
}
