/* Reshapes the React Router Workers build into the _worker.js directory Cloudflare Pages
   expects, and writes the edge entry that every request passes through. */

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
  "Cross-Origin-Opener-Policy": "same-origin",
};

const contentSecurityPolicy = (nonce) =>
  [
    "default-src 'self'",
    \`script-src 'nonce-\${nonce}' 'strict-dynamic'\`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://i.scdn.co",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "object-src 'none'",
  ].join("; ");

const rebuild = (response, headers) =>
  new Response(response.body, { status: response.status, statusText: response.statusText, headers });

function secure(response) {
  const headers = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([name, value]) => headers.set(name, value));

  if (!headers.get("Content-Type")?.startsWith("text/html")) return rebuild(response, headers);

  /* React Router inlines hydration state in <script> tags that change on every request,
     so a hash cannot cover them. A fresh nonce is stamped onto each script as the HTML
     streams through, and the policy trusts only what carries it. */
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  headers.set("Content-Security-Policy", contentSecurityPolicy(nonce));

  const stamp = { element: (element) => element.setAttribute("nonce", nonce) };
  return new HTMLRewriter()
    .on("script", stamp)
    .on('link[rel="modulepreload"]', stamp)
    .transform(rebuild(response, headers));
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    /* The asset binding is backed by the output directory, which holds the compiled
       server bundle. Without this guard its source is publicly readable. */
    if (pathname === "/_worker.js" || pathname.startsWith("/_worker.js/")) {
      return new Response("Not found", { status: 404 });
    }

    /* GET and HEAD only: a POST whose path matched an asset would otherwise be answered
       with the file and never reach the route's action. */
    if (request.method === "GET" || request.method === "HEAD") {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status < 400) return secure(asset);
    }

    return secure(await server.fetch(request, env, ctx));
  },
};
`;

const remove = (...paths) =>
  Promise.all(paths.map((path) => rm(path, { recursive: true, force: true })));

await remove(WORKER);
await mkdir(WORKER, { recursive: true });
await cp(SERVER, join(WORKER, "server"), { recursive: true });
await writeFile(join(WORKER, "index.js"), ENTRY);

/* wrangler.json would redirect a Pages deploy to Workers, and .dev.vars holds every local
   secret. Neither may reach the uploaded bundle. */
await remove(
  join(WORKER, "server", "wrangler.json"),
  join(WORKER, "server", ".dev.vars"),
  join(WORKER, "server", ".vite"),
  join(CLIENT, ".vite"),
  join(CLIENT, ".assetsignore"),
  SERVER,
  ".wrangler/deploy",
);

console.log(`Pages bundle ready: ${CLIENT}`);
console.log(`  _worker.js/ contains ${(await readdir(WORKER)).join(", ")}`);
