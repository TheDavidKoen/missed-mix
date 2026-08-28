import { data } from "react-router";

import { AuthPanel } from "../components/AuthPanel";
import { providerSchema } from "../lib/auth-providers";
import type { Route } from "./+types/register";

export function meta() {
  return [{ title: "Sign up | Missed Mix" }, { name: "robots", content: "noindex" }];
}

export async function action({ request }: Route.ActionArgs) {
  const parsed = providerSchema.safeParse((await request.formData()).get("provider"));

  if (!parsed.success) {
    return data({ error: "That sign-in provider is not supported." }, { status: 400 });
  }

  return data({ error: "Sign-in is not wired up yet. OAuth lands in stage 2." }, { status: 501 });
}

export default function Register({ actionData }: Route.ComponentProps) {
  return <AuthPanel intent="register" error={actionData?.error} />;
}
