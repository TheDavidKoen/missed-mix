/* logout.tsx — Ends the session and returns to the landing page. */

import { redirect } from "react-router";

import { cloudflareContext } from "~/lib/context";
import { endSession } from "~/lib/session";
import type { Route } from "./+types/logout";

export async function loader() {
  throw redirect("/");
}

export async function action({ request, context }: Route.ActionArgs) {
  return endSession(request, context.get(cloudflareContext).env, "/");
}
