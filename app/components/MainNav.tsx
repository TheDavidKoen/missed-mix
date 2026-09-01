import { Form, NavLink } from "react-router";
import { NAV } from "~/content";
import { PillButton } from "./Pill";
import { Wordmark } from "./Wordmark";

export function MainNav({ ready }: { ready: boolean }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-10">
      <Wordmark className="text-xl" />

      {ready ? (
        <nav aria-label="Main" className="order-last w-full sm:order-none sm:w-auto">
          <ul className="flex gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex rounded-pill px-4 py-2 text-sm font-bold tracking-tight transition-colors ${
                      isActive ? "bg-raised text-ink" : "text-muted hover:text-ink"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <Form method="post" action="/logout">
        <PillButton type="submit" variant="secondary" className="px-6 py-2 text-sm">
          Log out
        </PillButton>
      </Form>
    </header>
  );
}
