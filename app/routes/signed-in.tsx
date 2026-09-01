import { Outlet, redirect } from "react-router";

import { MainNav } from "~/components/MainNav";
import { cloudflareContext } from "~/lib/context";
import { readProfile } from "~/lib/profile";
import { currentUsername } from "~/lib/session";
import type { Route } from "./+types/signed-in";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const username = await currentUsername(request, env);
  if (!username) throw redirect("/login");

  const profile = await readProfile(env, username.toLowerCase());
  return { username, profile };
}

export default function SignedIn({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-full flex-col">
      <MainNav ready={Boolean(loaderData.profile)} />
      <Outlet />
    </div>
  );
}
