import http from "node:http";
import process from "node:process";

const PORT = 4000;

export function createApp() {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/health") {
      const verbose = url.searchParams.get("verbose"); // null if missing
      res.writeHead(200, { "Content-type": "application/json" });
      res.end(
        JSON.stringify({
          data: "Server is healthy",
          verbose, // e.g. "true" for /health?verbose=true
        }),
      );
      return;
    }

    if (url.pathname === "/health" && !(req.method === "GET")) {
      res.writeHead(405, { "Content-Type": "application/json" });
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
