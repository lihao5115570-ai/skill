import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const frontendOut = resolve(root, "frontend", "out");
const dist = resolve(root, "dist");

if (!existsSync(frontendOut)) {
  throw new Error("frontend/out was not generated. Run the frontend build before preparing Sites output.");
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(frontendOut, dist, { recursive: true });
