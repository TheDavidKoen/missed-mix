/* Fails the build when the shipped assets exceed their budgets, or when the edge entry
   has lost a guard. Enforces docs/performance.md and the regressions in ADR 0002. */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const CLIENT = "build/client";
const WORKER = join(CLIENT, "_worker.js");
const BUDGET_KB = { js: 125, css: 8, woff2: 35 };

if (!existsSync(WORKER)) {
  console.error(`No ${WORKER}. Run "pnpm run pages:build" before the budget check.`);
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const shipped = walk(CLIENT).filter((file) => !file.includes("_worker.js"));
const ofType = (extension) => shipped.filter((file) => file.endsWith(`.${extension}`));
const gzipKb = (files) =>
  files.reduce((total, file) => total + gzipSync(readFileSync(file)).length / 1024, 0);

const measured = Object.fromEntries(
  Object.keys(BUDGET_KB).map((extension) => [extension, gzipKb(ofType(extension))]),
);
const styles = ofType("css")
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
const entry = readFileSync(join(WORKER, "index.js"), "utf8");
const serverFile = (name) => existsSync(join(WORKER, "server", name));

const guards = [
  ...Object.entries(BUDGET_KB).map(([extension, budget]) => [
    measured[extension] > budget,
    `${extension} ${measured[extension].toFixed(1)} KB exceeds ${budget} KB`,
  ]),
  [/fonts\.(googleapis|gstatic)\.com/.test(styles), "built CSS reaches out to Google Fonts"],
  [!measured.woff2, "no self-hosted font files in the build"],
  [!entry.includes('startsWith("/_worker.js/")'), "entry has no _worker.js guard"],
  [!entry.includes("strict-dynamic"), "entry no longer sets a nonce-based Content Security Policy"],
  ...["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy"].map((header) => [
    !entry.includes(header),
    `entry no longer sets ${header}`,
  ]),
  [existsSync(join(CLIENT, ".vite")), ".vite build manifest would be served"],
  [serverFile("wrangler.json"), "Workers deploy pointer left in the bundle"],
  [serverFile(".dev.vars"), ".dev.vars is inside the deployable bundle"],
];

const failures = guards.filter(([failed]) => failed).map(([, message]) => message);

console.log(
  Object.entries(BUDGET_KB)
    .map(
      ([ext, budget]) =>
        `  ${ext.padEnd(6)} ${measured[ext].toFixed(1)} KB gzip  (budget ${budget})`,
    )
    .concat(`  edge guards ${failures.length ? "BROKEN" : "intact"}`)
    .join("\n"),
);

if (failures.length) {
  console.error(`\nBudget check failed:\n${failures.map((f) => `  - ${f}`).join("\n")}`);
  process.exit(1);
}

console.log("\nBudget check passed.");
