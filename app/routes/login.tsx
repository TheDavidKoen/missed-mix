import { AuthPanel } from "~/components/AuthPanel";
import { AUTH, SITE } from "~/content";
import { submitCredentials } from "~/lib/auth";
import { cloudflareContext } from "~/lib/context";
import type { Route } from "./+types/login";

export function meta() {
  return [{ title: `${AUTH.login.title} | ${SITE.name}` }, { name: "robots", content: "noindex" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  return submitCredentials(request, "login", context.get(cloudflareContext).env);
}

export default function Login({ actionData }: Route.ComponentProps) {
  return <AuthPanel intent="login" result={actionData} />;
}
