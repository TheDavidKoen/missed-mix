import { Outlet, redirect } from "react-router";

import { MainNav } from "~/components/MainNav";
import { cloudflareContext } from "~/lib/context";
import { currentUsername } from "~/lib/session";
import { readShell } from "~/lib/shell";
import type { Route } from "./+types/signed-in";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const username = await currentUsername(request, env);
  if (!username) throw redirect("/login");

  const { profile, unread } = await readShell(env, username.toLowerCase());
  return { username, profile, unread };
}

export default function SignedIn({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-full flex-col">
      <MainNav ready={Boolean(loaderData.profile)} unread={loaderData.unread} />
      <Outlet />
    </div>
  );
}
