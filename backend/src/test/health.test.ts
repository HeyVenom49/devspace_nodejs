import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../index.js";

type HealthBody = { data: string; verbose?: boolean };

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
    assert.equal(body.verbose, false);
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

test("GET /health?verbose=true returns boolean true", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/health?verbose=true`);
    const body = (await res.json()) as HealthBody;

    assert.equal(res.status, 200);
    assert.equal(body.data, "Server is healthy");
    assert.equal(body.verbose, true);
    assert.equal(typeof body.verbose, "boolean");
  });
});

test("GET /health?verbose=false returns boolean false", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/health?verbose=false`);
    const body = (await res.json()) as HealthBody;

    assert.equal(res.status, 200);
    assert.equal(body.verbose, false);
    assert.equal(typeof body.verbose, "boolean");
  });
});

test("GET /health?verbose=yes returns 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/health?verbose=yes`);
    const body = (await res.json()) as HealthBody;

    assert.equal(res.status, 400);
    assert.equal(body.data, "verbose must be true or false");
  });
});

test("POST /health returns 405", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/health`, { method: "POST" });
    const body = (await res.json()) as HealthBody;

    assert.equal(res.status, 405);
    assert.equal(body.data, "Method not allowed");
    assert.equal(res.headers.get("allow"), "GET, HEAD"); // <- yeh check
  });
});

test("HEAD /health return 200 with no body", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/health`, { method: "HEAD" });
    const text = await res.text();

    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "application/json");
    assert.equal(text, ""); // no body
  });
});
