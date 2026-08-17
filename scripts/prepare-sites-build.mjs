import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const frontendOut = resolve(root, "frontend", "out");
const dist = resolve(root, "dist");
const publicDir = resolve(dist, "public");
const serverDir = resolve(dist, "server");

if (!existsSync(frontendOut)) {
  throw new Error("frontend/out was not generated. Run the frontend build before preparing Sites output.");
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });
mkdirSync(serverDir, { recursive: true });
cpSync(frontendOut, publicDir, { recursive: true });
cpSync(resolve(root, ".openai"), resolve(dist, ".openai"), { recursive: true });

writeFileSync(
  resolve(serverDir, "index.js"),
  `function assetBinding(env) {
  return env?.ASSETS || env?.assets || env?.STATIC_ASSETS;
}

function candidatePaths(pathname) {
  const clean = pathname.replace(/\\/+/g, "/");
  if (clean === "/" || clean === "") {
    return ["/index.html"];
  }
  const base = clean.endsWith("/") ? clean.slice(0, -1) : clean;
  const candidates = [base];
  if (!base.includes(".")) {
    candidates.push(base + ".html");
    candidates.push(base + "/index.html");
  }
  candidates.push("/index.html");
  return candidates;
}

async function fetchAsset(request, env) {
  const binding = assetBinding(env);
  if (!binding || typeof binding.fetch !== "function") {
    return new Response("Static asset binding is unavailable.", { status: 500 });
  }
  const url = new URL(request.url);
  for (const pathname of candidatePaths(url.pathname)) {
    const assetUrl = new URL(request.url);
    assetUrl.pathname = pathname;
    const response = await binding.fetch(new Request(assetUrl, request));
    if (response.status !== 404 || pathname === "/index.html") {
      return response;
    }
  }
  return new Response("Not found", { status: 404 });
}

export default {
  fetch(request, env) {
    return fetchAsset(request, env);
  }
};
`,
);
