import type { ComponentType } from "react";
import { Form, Link, useNavigation } from "react-router";

import { type AuthProvider, providerSchema } from "../lib/auth-providers";
import { PillButton } from "./PillButton";
import { DiscordMark, GoogleMark } from "./ProviderMarks";
import { Wordmark } from "./Wordmark";

const copy = {
  login: {
    heading: "Log in to Missed Mix",
    prompt: "Not on Missed Mix yet?",
    label: "Sign up",
    to: "/register",
  },
  register: {
    heading: "Sign up for Missed Mix",
    prompt: "Already have an account?",
    label: "Log in",
    to: "/login",
  },
} as const;

const providers: Record<AuthProvider, { label: string; Mark: ComponentType }> = {
  google: { label: "Continue with Google", Mark: GoogleMark },
  discord: { label: "Continue with Discord", Mark: DiscordMark },
};

export function AuthPanel({ intent, error }: { intent: keyof typeof copy; error?: string }) {
  const navigation = useNavigation();
  const pending = navigation.formData?.get("provider");
  const text = copy[intent];

  return (
    <main className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <Link to="/" className="mb-10 rounded-pill">
        <Wordmark className="text-xl" />
      </Link>

      <section className="w-full max-w-md rounded-3xl bg-surface p-8 sm:p-10">
        <h1 className="text-center text-3xl font-black tracking-tight">{text.heading}</h1>

        {error ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-line bg-raised px-4 py-3 text-sm text-muted"
          >
            {error}
          </p>
        ) : null}

        <Form method="post" className="mt-8 flex flex-col gap-3">
          <input type="hidden" name="intent" value={intent} />
          {providerSchema.options.map((id) => {
            const { label, Mark } = providers[id];
            return (
              <PillButton
                key={id}
                type="submit"
                name="provider"
                value={id}
                variant="secondary"
                className="w-full"
                disabled={pending === id}
              >
                <Mark />
                {pending === id ? "Redirecting..." : label}
              </PillButton>
            );
          })}
        </Form>

        <p className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
          {text.prompt}{" "}
          <Link
            to={text.to}
            className="font-bold text-ink underline underline-offset-4 hover:text-accent"
          >
            {text.label}
          </Link>
        </p>
      </section>

      <p className="mt-8 max-w-md text-center text-xs text-muted">
        Missed Mix never sees a password. You sign in with Google or Discord, and we store only your
        provider ID, your email address, and the profile you choose to fill in.
      </p>
    </main>
  );
}
