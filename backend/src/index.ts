import http from "node:http";

const PORT = 4000;

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (req.method === "GET" && req.url === "/health") {
    const name = url.searchParams.get("verbose"); // null if missing
    res.writeHead(200, { "Content-type": "application/json" });
    res.end(
      JSON.stringify({
        data: "Server is healthy",
        name, // e.g. "true" for /health?verbose=true
      }),
    );
    return;
  }

  res.writeHead(404, { "Content-type": "application/json" });
  res.end(JSON.stringify({ data: "invalid path" }));
});

server.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
