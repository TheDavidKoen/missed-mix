/* Secrets are declared here rather than left to `wrangler types`, which derives
   them from .dev.vars. That file is gitignored, so CI has no copy and the
   generated Env would be missing every one of these. */

interface MissedMixSecrets {
  MONGODB_URI: string;
  MONGODB_DB: string;

  SESSION_SECRET: string;

  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
}

declare namespace Cloudflare {
  interface Env extends MissedMixSecrets {}
}

interface Env extends MissedMixSecrets {}
