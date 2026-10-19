import http from "node:http";
import process from "node:process";

const PORT = 4000;

export function createApp() {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    const isHealth = url.pathname === "/health";
    const isRead = req.method === "GET" || req.method === "HEAD";

    if (isHealth && isRead) {
      const verboseParam = url.searchParams.get("verbose"); // null if missing
      if (
        verboseParam !== null &&
        verboseParam !== "true" &&
        verboseParam !== "false"
      ) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: "verbose must be true or false" }));
        return;
      }

      const verbose = verboseParam === "true";
      const body = JSON.stringify({
        data: "Server is healthy",
        verbose, // e.g. "true" for /health?verbose=true
      });
      res.writeHead(200, {
        "Content-type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      });
      // HEAD: headers only - Node will omit body if you end without data
      if (req.method === "HEAD") {
        res.end(); // no body string
        return;
      }
      res.end(body);
      return;
    }

    if (isHealth && !isRead) {
      res.writeHead(405, {
        "Content-Type": "application/json",
        allow: "GET, HEAD",
      });
      res.end(JSON.stringify({ data: "Method not allowed" }));
      return;
    }

    res.writeHead(404, { "Content-type": "application/json" });
    res.end(JSON.stringify({ data: "invalid path" }));
  });
}

// Only start when this file is the entrypoint
const isMain =
  process.argv[1]?.endsWith("index.ts") ||
  process.argv[1]?.endsWith("index.js");

if (isMain) {
  createApp().listen(PORT, () =>
    console.log(`Server is listening on PORT ${PORT}`),
  );
}
