import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CLIENT = "build/client";
const SERVER = "build/server";
const WORKER = join(CLIENT, "_worker.js");

/* This is the whole edge boundary in Pages advanced mode: every request reaches
   it, and Pages serves no static file on its own, so the entry does the asset
   lookup itself.

   Three things here are load-bearing.

   The asset lookup is GET and HEAD only. A POST whose path matched an asset
   would otherwise be answered with the asset and never reach a route action.

   The _worker.js guard exists because the asset binding in `wrangler pages dev`
   is backed by the output directory, this directory included, which serves the
   compiled server bundle to anyone who asks for it.

   Response headers are set here rather than in a _headers file because _headers
   applies only to static responses in Pages, so SSR responses would miss them. */
const ENTRY = `import server from "./server/index.js";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

function harden(response) {
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
      if (asset.status < 400) return harden(asset);
    }

    return harden(await server.fetch(request, env, ctx));
  },
};
`;

await rm(WORKER, { recursive: true, force: true });
await mkdir(WORKER, { recursive: true });
await cp(SERVER, join(WORKER, "server"), { recursive: true });

/* wrangler.json here is a Workers deploy pointer. Left in place, wrangler pages
   follows it and uploads the Workers build instead of this directory. */
await rm(join(WORKER, "server", "wrangler.json"), { force: true });
await rm(join(WORKER, "server", ".vite"), { recursive: true, force: true });

await writeFile(join(WORKER, "index.js"), ENTRY);

/* Build metadata, not public assets. */
await rm(join(CLIENT, ".vite"), { recursive: true, force: true });
await rm(join(CLIENT, ".assetsignore"), { force: true });

await rm(SERVER, { recursive: true, force: true });
await rm(".wrangler/deploy", { recursive: true, force: true });

const listed = await readdir(WORKER);
console.log(`Pages bundle ready: ${CLIENT}`);
console.log(`  _worker.js/ contains ${listed.join(", ")}`);
