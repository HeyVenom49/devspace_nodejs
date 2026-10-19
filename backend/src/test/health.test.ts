import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../index.js";

type HealthBody = { data: string; verbose?: boolean };
type ErrorBody = { error: { message: string; status: number } };

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
    const body = (await res.json()) as ErrorBody;

    assert.equal(res.status, 404);
    assert.equal(body.error.message, "invalid path");
    assert.equal(body.error.status, 404);
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
    const body = (await res.json()) as ErrorBody;

    assert.equal(res.status, 400);
    assert.equal(body.error.message, "verbose must be true or false");
    assert.equal(body.error.status, 400);
  });
});

test("GET /health with verbose twice returns 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(
      `${baseUrl}/health?verbose=true&verbose=false`,
    );
    const body = (await res.json()) as ErrorBody;

    assert.equal(res.status, 400);
    assert.equal(body.error.message, "verbose must be provided only once");
    assert.equal(body.error.status, 400);
  });
});

test("GET /health with verbose=true twice returns 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(
      `${baseUrl}/health?verbose=true&verbose=true`,
    );
    const body = (await res.json()) as ErrorBody;

    assert.equal(res.status, 400);
    assert.equal(body.error.message, "verbose must be provided only once");
    assert.equal(body.error.status, 400);
  });
});

test("POST /health returns 405", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/health`, { method: "POST" });
    const body = (await res.json()) as ErrorBody;

    assert.equal(res.status, 405);
    assert.equal(body.error.message, "Method not allowed");
    assert.equal(body.error.status, 405);
    assert.equal(res.headers.get("allow"), "GET, HEAD");
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
