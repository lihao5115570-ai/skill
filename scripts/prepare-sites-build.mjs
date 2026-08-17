import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

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

function collectHtmlRoutes(dir, baseDir = dir) {
  const routes = {};
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      Object.assign(routes, collectHtmlRoutes(fullPath, baseDir));
      continue;
    }
    if (!entry.endsWith(".html")) {
      continue;
    }
    const assetPath = "/" + relative(baseDir, fullPath).split(sep).join("/");
    const html = readFileSync(fullPath, "utf8");
    routes[assetPath] = html;
    if (assetPath === "/index.html") {
      routes["/"] = html;
    } else if (assetPath.endsWith("/index.html")) {
      routes[assetPath.slice(0, -"/index.html".length)] = html;
    } else {
      routes[assetPath.slice(0, -".html".length)] = html;
    }
  }
  return routes;
}

const htmlRoutes = collectHtmlRoutes(publicDir);

writeFileSync(
  resolve(serverDir, "index.js"),
  `const htmlRoutes = ${JSON.stringify(htmlRoutes)};

function assetBinding(env) {
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
  const url = new URL(request.url);
  const html = htmlRoutes[url.pathname] || htmlRoutes[url.pathname.replace(/\\/$/, "")];
  if (html) {
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });
  }

  const binding = assetBinding(env);
  if (!binding || typeof binding.fetch !== "function") {
    return new Response("Static asset binding is unavailable.", { status: 500 });
  }
  for (const pathname of candidatePaths(url.pathname)) {
    if (htmlRoutes[pathname]) {
      return new Response(htmlRoutes[pathname], {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache"
        }
      });
    }
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
