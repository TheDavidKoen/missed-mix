/* bundle-pages.mjs — Reshapes the Workers build into the _worker.js directory Pages
   expects, and writes the edge entry that serves assets first, blocks the server bundle
   and sets the security headers. */

import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CLIENT = "build/client";
const SERVER = "build/server";
const WORKER = join(CLIENT, "_worker.js");

const ENTRY = `import server from "./server/index.js";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (pathname === "/_worker.js" || pathname.startsWith("/_worker.js/")) {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET" || request.method === "HEAD") {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status < 400) return withSecurityHeaders(asset);
    }

    return withSecurityHeaders(await server.fetch(request, env, ctx));
  },
};
`;

await rm(WORKER, { recursive: true, force: true });
await mkdir(WORKER, { recursive: true });
await cp(SERVER, join(WORKER, "server"), { recursive: true });

await rm(join(WORKER, "server", "wrangler.json"), { force: true });

await rm(join(WORKER, "server", ".dev.vars"), { force: true });
await rm(join(WORKER, "server", ".vite"), { recursive: true, force: true });

await writeFile(join(WORKER, "index.js"), ENTRY);

await rm(join(CLIENT, ".vite"), { recursive: true, force: true });
await rm(join(CLIENT, ".assetsignore"), { force: true });

await rm(SERVER, { recursive: true, force: true });
await rm(".wrangler/deploy", { recursive: true, force: true });

const listed = await readdir(WORKER);
console.log(`Pages bundle ready: ${CLIENT}`);
console.log(`  _worker.js/ contains ${listed.join(", ")}`);
