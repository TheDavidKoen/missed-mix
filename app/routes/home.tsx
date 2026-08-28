import { PillLink } from "../components/PillButton";
import { Wordmark } from "../components/Wordmark";

export function meta() {
  return [
    { title: "Missed Mix" },
    {
      name: "description",
      content: "Find people whose music taste lines up with yours, then send them a vibration.",
    },
  ];
}

const steps = [
  {
    title: "Build a profile",
    body: "A short bio, a picture, and the artists you actually listen to.",
  },
  {
    title: "Find your overlap",
    body: "Missed Mix scores every profile against your taste and ranks the closest.",
  },
  {
    title: "Send a vibration",
    body: "A quiet nudge. Accept one and a private conversation opens.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Wordmark className="text-xl" />
        <PillLink to="/login" variant="secondary" className="px-6 py-2 text-sm">
          Log in
        </PillLink>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
        <h1 className="max-w-3xl text-balance text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
          Someone out there has your playlist.
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-muted">
          Missed Mix matches people on what they listen to. Build a profile, find the overlap, send
          a vibration.
        </p>

        <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <PillLink to="/register">Sign up free</PillLink>
          <PillLink to="/login" variant="secondary">
            Log in
          </PillLink>
        </div>

        <ol className="mt-20 grid w-full max-w-4xl gap-4 text-left sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl bg-raised p-6 transition-colors hover:bg-raised-hover"
            >
              <span className="text-sm font-bold text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-2 text-lg font-bold tracking-tight">{step.title}</h2>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </main>

      <footer className="border-t border-line px-6 py-8 text-center text-sm text-muted sm:px-10">
        <p>
          Music data from Spotify. Missed Mix is an independent portfolio project and is not
          affiliated with Spotify AB.
        </p>
      </footer>
    </div>
  );
}
