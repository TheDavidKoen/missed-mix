/* app.ts — Worker entry. Opens one database session per request, runs the React Router
   handler inside it, and closes the session once the response is on its way. */

import { createRequestHandler, RouterContextProvider } from "react-router";

import { cloudflareContext } from "../app/lib/context";
import { beginDbSession, runInDbSession } from "../app/lib/mongo";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env, ctx });

    const session = beginDbSession(env);

    try {
      return await runInDbSession(session, () => requestHandler(request, context));
    } finally {
      ctx.waitUntil(session.close());
    }
  },
} satisfies ExportedHandler<Env>;
