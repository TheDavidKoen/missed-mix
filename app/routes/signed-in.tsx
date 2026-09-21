import { Outlet } from "react-router";

import { MainNav } from "~/components/MainNav";
import { cloudflareContext, viewerContext } from "~/lib/context";
import { requireViewer } from "~/lib/session";
import { readViewer } from "~/lib/viewer";
import type { Route } from "./+types/signed-in";

export const middleware: Route.MiddlewareFunction[] = [requireViewer];

export async function loader({ context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const { username, usernameLower } = context.get(viewerContext);

  const { profile, unread } = await readViewer(env, usernameLower);
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
