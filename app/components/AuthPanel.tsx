import { Form, Link, useNavigation } from "react-router";

import { AUTH } from "~/content";
import type { AuthIntent, AuthResult } from "~/lib/auth";
import { Field } from "./Field";
import { PillButton } from "./Pill";
import { Wordmark } from "./Wordmark";

export function AuthPanel({ intent, result }: { intent: AuthIntent; result?: AuthResult }) {
  const navigation = useNavigation();
  const pending = navigation.state === "submitting";
  const copy = AUTH[intent];
  const fieldErrors = result?.fieldErrors ?? {};

  return (
    <main className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <Link to="/" className="mb-10 rounded-pill">
        <Wordmark className="text-xl" />
      </Link>

      <section className="w-full max-w-md rounded-3xl bg-surface p-8 sm:p-10">
        <h1 className="text-center text-3xl font-black tracking-tight">{copy.heading}</h1>

        {result?.error ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-line bg-raised px-4 py-3 text-sm text-muted"
          >
            {result.error}
          </p>
        ) : null}

        <Form method="post" className="mt-8 flex flex-col gap-5">
          <Field
            name="username"
            label={AUTH.fields.username}
            type="text"
            autoComplete="username"
            defaultValue={result?.username}
            error={fieldErrors.username}
          />
          <Field
            name="password"
            label={AUTH.fields.password}
            type="password"
            autoComplete={intent === "register" ? "new-password" : "current-password"}
            hint={intent === "register" ? AUTH.passwordHint : undefined}
            error={fieldErrors.password}
          />

          <PillButton type="submit" className="mt-1 w-full" disabled={pending}>
            {pending ? "Working..." : copy.submit}
          </PillButton>
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

      <p className="mt-8 max-w-md text-center text-xs text-muted">{AUTH.demoNotice}</p>
    </main>
  );
}
