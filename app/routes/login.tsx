import { AuthPanel } from "~/components/AuthPanel";
import { AUTH, SITE } from "~/content";
import { beginSignIn } from "~/lib/auth";
import type { Route } from "./+types/login";

export function meta() {
  return [{ title: `${AUTH.login.title} | ${SITE.name}` }, { name: "robots", content: "noindex" }];
}

export async function action({ request }: Route.ActionArgs) {
  return beginSignIn(request);
}

export default function Login({ actionData }: Route.ComponentProps) {
  return <AuthPanel intent="login" error={actionData?.error} />;
}
