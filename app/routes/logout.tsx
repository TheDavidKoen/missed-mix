import { redirect } from "react-router";

import { cloudflareContext } from "~/lib/context";
import { endSession } from "~/lib/session";
import type { Route } from "./+types/logout";

/* A GET never signs out, so a prefetch or an image pointed here cannot end a session. */
export async function loader() {
  throw redirect("/");
}

export async function action({ request, context }: Route.ActionArgs) {
  return endSession(request, context.get(cloudflareContext).env, "/");
}
