import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const CLIENT = "build/client";
const WORKER = join(CLIENT, "_worker.js");

/* Mirrors docs/PERFORMANCE.md. Changing a number here means changing it there. */
const BUDGET = {
  clientJsKb: 125,
  cssKb: 8,
  fontKb: 35,
};

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const gzipKb = (path) => gzipSync(readFileSync(path)).length / 1024;
const sum = (files) => files.reduce((total, file) => total + gzipKb(file), 0);

if (!existsSync(WORKER)) {
  console.error(`No ${WORKER}. Run "pnpm run pages:build" before the budget check.`);
  process.exit(1);
}

/* Everything under _worker.js runs on the server and is never sent to a browser. */
const shipped = walk(CLIENT).filter((file) => !file.includes("_worker.js"));

const jsKb = sum(shipped.filter((f) => f.endsWith(".js")));
const cssKb = sum(shipped.filter((f) => f.endsWith(".css")));
const fontKb = sum(shipped.filter((f) => f.endsWith(".woff2")));

const failures = [];
const report = [
  `client js  ${jsKb.toFixed(1)} KB gzip  (budget ${BUDGET.clientJsKb})`,
  `css        ${cssKb.toFixed(1)} KB gzip  (budget ${BUDGET.cssKb})`,
  `fonts      ${fontKb.toFixed(1)} KB gzip  (budget ${BUDGET.fontKb})`,
];

if (jsKb > BUDGET.clientJsKb) {
  failures.push(`client JS ${jsKb.toFixed(1)} KB exceeds ${BUDGET.clientJsKb} KB`);
}
if (cssKb > BUDGET.cssKb) {
  failures.push(`CSS ${cssKb.toFixed(1)} KB exceeds ${BUDGET.cssKb} KB`);
}
if (fontKb > BUDGET.fontKb) {
  failures.push(`fonts ${fontKb.toFixed(1)} KB exceeds ${BUDGET.fontKb} KB`);
}

/* Regression guard for ADR 0005. A stylesheet that reaches out to Google Fonts
   still renders correctly, so nothing looks broken. It just adds a third-party
   connection to the critical path and puts a visitor's IP in someone else's log. */
const styles = shipped
  .filter((f) => f.endsWith(".css"))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

if (/fonts\.(googleapis|gstatic)\.com/.test(styles)) {
  failures.push("built CSS reaches out to Google Fonts, fonts are meant to be self-hosted");
}
if (!fontKb) {
  failures.push("no self-hosted font files in the build");
}

/* Regression guard for ADR 0002. Each of these fails silently: the site keeps
   serving and every page keeps rendering, while the server bundle becomes
   publicly readable or SSR responses quietly lose their headers. */
const entry = readFileSync(join(WORKER, "index.js"), "utf8");

if (!entry.includes('startsWith("/_worker.js/")')) {
  failures.push("Pages entry has no _worker.js guard, the server bundle is publicly readable");
}
for (const header of ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy"]) {
  if (!entry.includes(header)) failures.push(`Pages entry no longer sets ${header}`);
}
if (existsSync(join(CLIENT, ".vite"))) {
  failures.push(".vite build manifest is still in the output and would be served");
}
if (existsSync(join(WORKER, "server", "wrangler.json"))) {
  failures.push("Workers deploy pointer left in the bundle, wrangler pages will follow it");
}
if (existsSync(join(WORKER, "server", ".dev.vars"))) {
  failures.push(".dev.vars is inside the deployable bundle, every secret with it");
}

report.push(`edge guards ${failures.length ? "BROKEN" : "intact"}`);
console.log(report.map((line) => `  ${line}`).join("\n"));

if (failures.length) {
  console.error("\nBudget check failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("\nBudget check passed.");
