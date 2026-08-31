import { createContext } from "react-router";

/* Secrets reach loaders and actions through here. On Pages the module-scope env
   from `cloudflare:workers` carries only the platform bindings (CF_PAGES*,
   ASSETS); anything from .dev.vars or the project's secrets arrives as the env
   argument to fetch in workers/app.ts and is only reachable if it is passed on. */
export const cloudflareContext = createContext<{ env: Env; ctx: ExecutionContext }>();
