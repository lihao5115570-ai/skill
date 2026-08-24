import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const previewSource = resolve(root, "preview");
const dist = resolve(root, "dist");

if (!existsSync(previewSource)) {
  throw new Error("preview directory was not found.");
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(previewSource, dist, { recursive: true });

console.log("Cloudflare Pages build complete: dist/");
