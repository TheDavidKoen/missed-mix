import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-canvas font-sans text-ink antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const heading = isRouteErrorResponse(error) ? String(error.status) : "Something broke";
  const detail = isRouteErrorResponse(error)
    ? error.statusText || "That page does not exist."
    : "An unexpected error stopped this page from loading.";

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-6xl font-black tracking-tight">{heading}</h1>
      <p className="text-muted">{detail}</p>
      <a href="/" className="text-accent underline underline-offset-4">
        Back to the start
      </a>
    </main>
  );
}
