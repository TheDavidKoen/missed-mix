import { AuthPanel } from "~/components/AuthPanel";
import { AUTH, SITE } from "~/content";
import { submitCredentials } from "~/lib/auth";
import { cloudflareContext } from "~/lib/context";
import type { Route } from "./+types/register";

export function meta() {
  return [
    { title: `${AUTH.register.title} | ${SITE.name}` },
    { name: "robots", content: "noindex" },
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  return submitCredentials(request, "register", context.get(cloudflareContext).env);
}

export default function Register({ actionData }: Route.ComponentProps) {
  return <AuthPanel intent="register" result={actionData} />;
}
