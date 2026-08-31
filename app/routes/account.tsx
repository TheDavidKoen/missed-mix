import { Form, redirect } from "react-router";

import { PillButton, PillLink } from "~/components/Pill";
import { Wordmark } from "~/components/Wordmark";
import { SITE } from "~/content";
import { cloudflareContext } from "~/lib/context";
import { currentUsername, endSession } from "~/lib/session";
import type { Route } from "./+types/account";

export function meta() {
  return [{ title: `Account | ${SITE.name}` }, { name: "robots", content: "noindex" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const username = await currentUsername(request, context.get(cloudflareContext).env);
  if (!username) throw redirect("/login");

  return { username };
}

export async function action({ request, context }: Route.ActionArgs) {
  return endSession(request, context.get(cloudflareContext).env, "/");
}

export default function Account({ loaderData }: Route.ComponentProps) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
      <Wordmark className="mb-10 text-xl" />

      <section className="w-full max-w-md rounded-3xl bg-surface p-8 sm:p-10">
        <h1 className="text-3xl font-black tracking-tight">Signed in</h1>
        <p className="mt-4 text-muted">
          You are <span className="font-bold text-ink">{loaderData.username}</span>.
        </p>
        <p className="mt-4 text-sm text-muted">
          There is nothing here yet. Profiles arrive in stage 3, and discovery in stage 6.
        </p>

        <Form method="post" className="mt-8">
          <PillButton type="submit" variant="secondary" className="w-full">
            Log out
          </PillButton>
        </Form>
      </section>

      <PillLink to="/" variant="secondary" className="mt-6 px-6 py-2 text-sm">
        Back to the start
      </PillLink>
    </main>
  );
}
