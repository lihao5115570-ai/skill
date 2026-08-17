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
  `const { createServer } = require("node:http");
const { createReadStream, existsSync, statSync } = require("node:fs");
const { extname, join, normalize, resolve } = require("node:path");

const root = [
  resolve(__dirname, "..", "public"),
  resolve(process.cwd(), "dist", "public"),
  resolve(process.cwd(), "public")
].find((candidate) => existsSync(candidate));
if (!root) {
  throw new Error("Cannot locate static public directory.");
}
const port = Number(process.env.PORT || 3000);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function resolveRequestPath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const safe = normalize(clean).replace(/^([.][.][\\\\/])+/, "");
  const candidates = [];
  if (safe === "/" || safe === "") {
    candidates.push(join(root, "index.html"));
  } else {
    const base = join(root, safe);
    candidates.push(base);
    candidates.push(base + ".html");
    candidates.push(join(base, "index.html"));
  }
  candidates.push(join(root, "index.html"));
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

createServer((request, response) => {
  const filePath = resolveRequestPath(request.url || "/");
  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
    "Cache-Control": filePath.includes("_next") ? "public, max-age=31536000, immutable" : "no-cache"
  });
  createReadStream(filePath).pipe(response);
}).listen(port, "0.0.0.0");
`,
);
