/* Worker entry. Every request gets one database session, opened before the router runs
   and closed after the response is sent, so all its loaders share a single connection. */

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
