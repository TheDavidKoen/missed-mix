/* context.ts — Carries the Worker's env and execution context from the request handler
   into loaders and actions. */

import { createContext } from "react-router";

export const cloudflareContext = createContext<{ env: Env; ctx: ExecutionContext }>();
