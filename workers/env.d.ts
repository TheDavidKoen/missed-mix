/* Secrets are declared here rather than left to `wrangler types`, which derives
   them from .dev.vars. That file is gitignored, so CI has no copy and the
   generated Env would be missing every one of these. */

interface MissedMixSecrets {
  /* Atlas connection string. Set in .dev.vars locally, and as a Pages secret on
     both Production and Preview, which do not share values. */
  MONGODB_URI: string;
  MONGODB_DB: string;
  /* Signs the session cookie. Rotating it invalidates every active session. */
  SESSION_SECRET: string;
}

declare namespace Cloudflare {
  interface Env extends MissedMixSecrets {}
}

interface Env extends MissedMixSecrets {}
