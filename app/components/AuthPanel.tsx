import type { ComponentType } from "react";
import { Form, Link, useNavigation } from "react-router";

import { AUTH } from "~/content";
import { type AuthIntent, type AuthProvider, providerSchema } from "~/lib/auth";
import { PillButton } from "./Pill";
import { DiscordMark, GoogleMark } from "./ProviderMarks";
import { Wordmark } from "./Wordmark";

const marks: Record<AuthProvider, ComponentType> = {
  google: GoogleMark,
  discord: DiscordMark,
};

export function AuthPanel({ intent, error }: { intent: AuthIntent; error?: string }) {
  const navigation = useNavigation();
  const pending = navigation.formData?.get("provider");
  const copy = AUTH[intent];

  return (
    <main className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <Link to="/" className="mb-10 rounded-pill">
        <Wordmark className="text-xl" />
      </Link>

      <section className="w-full max-w-md rounded-3xl bg-surface p-8 sm:p-10">
        <h1 className="text-center text-3xl font-black tracking-tight">{copy.heading}</h1>

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
          {providerSchema.options.map((provider) => {
            const Mark = marks[provider];
            return (
              <PillButton
                key={provider}
                type="submit"
                name="provider"
                value={provider}
                variant="secondary"
                className="w-full"
                disabled={pending === provider}
              >
                <Mark />
                {pending === provider ? "Redirecting..." : AUTH.providers[provider]}
              </PillButton>
            );
          })}
        </Form>

        <p className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
          {copy.prompt}{" "}
          <Link
            to={copy.switchTo}
            className="font-bold text-ink underline underline-offset-4 hover:text-accent"
          >
            {copy.switchLabel}
          </Link>
        </p>
      </section>

      <p className="mt-8 max-w-md text-center text-xs text-muted">{AUTH.disclosure}</p>
    </main>
  );
}
