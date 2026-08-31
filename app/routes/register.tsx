import { AuthPanel } from "~/components/AuthPanel";
import { AUTH, SITE } from "~/content";
import { beginSignIn } from "~/lib/auth";
import type { Route } from "./+types/register";

export function meta() {
  return [
    { title: `${AUTH.register.title} | ${SITE.name}` },
    { name: "robots", content: "noindex" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  return beginSignIn(request);
}

export default function Register({ actionData }: Route.ComponentProps) {
  return <AuthPanel intent="register" error={actionData?.error} />;
}
