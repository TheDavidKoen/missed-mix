/* env.d.ts — Types for the bindings and secrets the Worker receives. */

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
