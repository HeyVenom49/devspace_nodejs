import http from "node:http";

const PORT = 4000;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        data: "Server is healthy",
      }),
    );
  } else {
    res.write("Wrong path");
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
