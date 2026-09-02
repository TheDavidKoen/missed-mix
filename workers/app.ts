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

    /* Every loader on a page shares one connection. Closing runs after the
       response is handed back, so the handshake cost is paid once and the
       teardown is not on the critical path. Loaders have all resolved by the
       time the handler returns, so nothing still needs the client. */
    const session = beginDbSession(env);

    try {
      return await runInDbSession(session, () => requestHandler(request, context));
    } finally {
      ctx.waitUntil(session.close());
    }
  },
} satisfies ExportedHandler<Env>;
