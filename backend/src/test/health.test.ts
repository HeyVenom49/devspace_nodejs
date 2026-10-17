import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../index.js";

type HealthBody = { data: string; verbose?: string | null };

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const server = createApp();
  await new Promise<void>((resolve) => server.listen(0, resolve)); // port 0 = random free port
  const { port } = server.address() as AddressInfo;

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

test("GET /health returns 200 and healthy message", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as HealthBody;

    assert.equal(res.status, 200);
    assert.equal(body.data, "Server is healthy");
  });
});

test("unknown path returns 404", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/nope`);
    const body = (await res.json()) as HealthBody;

    assert.equal(res.status, 404);
    assert.equal(body.data, "invalid path");
  });
});

test("GET /health?verbose=true", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/health?verbose=true`);
    const body = (await res.json()) as HealthBody;

    assert.equal(res.status, 200);
    assert.equal(body.data, "Server is healthy");
    assert.equal(body.verbose, "true");
  });
});

test("POST /health returns 200 and healthy message", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/health`, { method: "POST" });
    const body = (await res.json()) as HealthBody;

    assert.equal(res.status, 200);
    assert.equal(body.data, "Server is healthy");
  });
});
