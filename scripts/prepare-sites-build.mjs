import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const previewSource = resolve(root, "preview");
const publicSource = resolve(root, "public");
const dist = resolve(root, "dist");

if (!existsSync(previewSource)) {
  throw new Error("preview directory was not found.");
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(previewSource, dist, { recursive: true });

const routeAliases = {
  start: "start.html",
  upload: "start.html",
  analyze: "start.html",
  result: "result.html",
  "beauty-report": "result.html",
  plus: "plus.html",
  "email-sent": "email-sent.html",
  mailbox: "mailbox.html",
  "confirm-email": "confirm-email.html",
  "plus-account": "plus-account.html",
  blogger: "blogger.html",
  bloggers: "blogger.html",
  "blogger-success": "blogger-success.html",
  "creator-admin": "creator-admin.html",
  privacy: "privacy.html",
};

for (const [route, fileName] of Object.entries(routeAliases)) {
  const source = resolve(dist, fileName);
  const routeDir = resolve(dist, route);
  if (!existsSync(source)) {
    throw new Error(`Cannot create route /${route}: ${fileName} was not found.`);
  }
  mkdirSync(routeDir, { recursive: true });
  copyFileSync(source, resolve(routeDir, "index.html"));
}

if (existsSync(publicSource)) {
  cpSync(publicSource, dist, { recursive: true });
}

console.log("Cloudflare Pages build complete: dist/");
