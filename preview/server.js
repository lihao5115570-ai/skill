const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 4173);
const routes = {
  "/": "index.html",
  "/index.html": "index.html",
  "/start": "start.html",
  "/result": "result.html",
  "/plus": "plus.html",
  "/email-sent": "email-sent.html",
  "/mailbox": "mailbox.html",
  "/confirm-email": "confirm-email.html",
  "/plus-account": "plus-account.html",
  "/blogger": "blogger.html",
  "/blogger-success": "blogger-success.html",
  "/creator-admin": "creator-admin.html",
  "/privacy": "privacy.html",
  "/style.css": "style.css",
};

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  const routeFile = routes[pathname];

  if (!routeFile) {
    res.writeHead(302, { Location: "/" });
    res.end();
    return;
  }

  const filePath = path.join(__dirname, routeFile);
  const contentType = routeFile.endsWith(".css") ? "text/css; charset=utf-8" : "text/html; charset=utf-8";

  fs.readFile(filePath, (error, html) => {
    if (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Preview file not found.");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    });
    res.end(html);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview running at http://127.0.0.1:${port}`);
});
