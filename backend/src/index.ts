import http from "node:http";
import process from "node:process";

const PORT = 4000;

export function createApp() {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    const isHealth = url.pathname === "/health";
    const isRead = req.method === "GET" || req.method === "HEAD";

    if (isHealth && isRead) {
      const verboseValues = url.searchParams.getAll("verbose");

      if (verboseValues.length > 1) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: { message: "verbose must be provided only once" },
          }),
        );
        return;
      }

      const verboseParam = verboseValues[0] ?? null;
      if (
        verboseParam !== null &&
        verboseParam !== "true" &&
        verboseParam !== "false"
      ) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: { message: "verbose must be true or false" },
          }),
        );
        return;
      }

      const verbose = verboseParam === "true";
      const body = JSON.stringify({
        data: "Server is healthy",
        verbose,
      });

      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      });

      if (req.method === "HEAD") {
        res.end();
        return;
      }

      res.end(body);
      return;
    }

    if (isHealth && !isRead) {
      res.writeHead(405, {
        "Content-Type": "application/json",
        Allow: "GET, HEAD",
      });
      res.end(
        JSON.stringify({ error: { message: "Method not allowed" } }),
      );
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: { message: "invalid path" } }));
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
