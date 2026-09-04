import { PillLink } from "~/components/Pill";
import { Wordmark } from "~/components/Wordmark";
import { LANDING, SITE } from "~/content";

export function meta() {
  return [{ title: SITE.name }, { name: "description", content: SITE.description }];
}

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="px-6 py-5 sm:px-10">
        <Wordmark className="text-xl" />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
        <h1 className="max-w-3xl text-balance text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
          {LANDING.headline}
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-muted">{LANDING.standfirst}</p>

        <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <PillLink to="/register">Sign up</PillLink>
          <PillLink to="/login" variant="secondary">
            Log in
          </PillLink>
        </div>

        <ol className="mt-20 grid w-full max-w-4xl items-start gap-4 text-left sm:grid-cols-3">
          {LANDING.steps.map((step, index) => (
            <li key={step.title}>
              <details
                name="missed-mix-steps"
                className="group rounded-2xl bg-raised p-6 transition-colors duration-500 ease-expand hover:bg-raised-hover open:bg-accent open:text-on-accent open:hover:bg-accent-hover"
              >
                <summary className="flex cursor-pointer list-none flex-col [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-accent group-open:text-on-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4 shrink-0 text-muted duration-500 ease-expand group-open:rotate-180 group-open:text-on-accent motion-safe:transition-transform"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="m6 9 6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <h2 className="mt-2 text-lg font-bold tracking-tight">{step.title}</h2>
                  <span className="mt-1 line-clamp-2 min-h-[2lh] text-sm text-muted group-open:text-on-accent/75">
                    {step.body}
                  </span>
                </summary>
                <p className="mt-4 border-t border-line pt-4 text-sm text-muted group-open:border-on-accent/25 group-open:text-on-accent/85">
                  {step.detail}
                </p>
              </details>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
