const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const handler = require(require("node:path").join("..", "api", "leaderboard"));

const originalFetch = global.fetch;
const originalEnv = { ...process.env };
afterEach(() => {
  global.fetch = originalFetch;
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

function configure() {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.example";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
}

async function request(method = "GET", options = {}) {
  const res = {
    headers: {},
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; }
  };
  await handler({ method, headers: {}, ...options }, res);
  return res;
}

async function session() {
  global.fetch = async () => ({ ok: true, json: async () => ({ result: [] }) });
  const res = await request();
  return res.headers["set-cookie"].split(";")[0];
}

test("missing database reports a configuration error rather than an empty leaderboard", async () => {
  configure();
  delete process.env.UPSTASH_REDIS_REST_URL;
  const res = await request();
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error, "not_configured");
});

test("unsupported methods return Allow", async () => {
  const res = await request("DELETE");
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, "GET, POST");
});

test("GET returns ranked rows and issues a private signed cookie", async () => {
  configure();
  const players = [{ id: "alice", name: "Alice", cleared: 200 }, { id: "bob", name: "Bob", cleared: 12 }];
  global.fetch = async (url, options) => {
    assert.equal(url, process.env.UPSTASH_REDIS_REST_URL);
    assert.equal(options.headers.Authorization, "Bearer test-token");
    const command = JSON.parse(options.body);
    assert.equal(command[0], "EVAL");
    assert.match(command[1], /"ZRANGE", KEYS\[1\], 0, 99, "REV"/);
    return { ok: true, json: async () => ({ result: players.map(player => JSON.stringify(player)) }) };
  };
  const res = await request();
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.players, players);
  assert.match(res.body.playerId, /^[a-f0-9-]{36}$/);
  assert.match(res.headers["set-cookie"], /HttpOnly; SameSite=Strict/);
  assert.equal(res.headers["cache-control"], "private, no-store");
});

test("returning visitors keep their identity; production cookies are Secure", async () => {
  configure();
  process.env.VERCEL = "1";
  global.fetch = async () => ({ ok: true, json: async () => ({ result: [] }) });
  const first = await request();
  assert.match(first.headers["set-cookie"], /; Secure$/);
  const second = await request("GET", { headers: { cookie: first.headers["set-cookie"].split(";")[0] } });
  assert.equal(second.body.playerId, first.body.playerId);
  assert.equal(second.headers["set-cookie"], undefined);
});

test("POST rejects missing and forged sessions without accessing Redis", async () => {
  configure();
  global.fetch = () => assert.fail("must not call Redis");
  for (const cookie of ["", "sudoku_player=" + "a".repeat(36) + "." + "0".repeat(64)]) {
    const res = await request("POST", { headers: { cookie } });
    assert.equal(res.statusCode, 401);
  }
});

test("POST validates score bounds, names and JSON", async () => {
  configure();
  const cookie = await session();
  global.fetch = () => assert.fail("invalid scores must not access Redis");
  for (const body of [
    "{", null, {}, { name: "", cleared: 1 }, { name: " ", cleared: 1 },
    { name: "a".repeat(17), cleared: 1 }, { name: "Alice", cleared: 0 },
    { name: "Alice", cleared: 201 }, { name: "Alice", cleared: 1.5 },
    { name: "Alice", cleared: "10" }
  ]) {
    const res = await request("POST", { headers: { cookie, "content-type": "application/json" }, body });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, "invalid_score");
  }
});

test("POST requires JSON and rejects oversized payloads", async () => {
  configure();
  const cookie = await session();
  const wrongType = await request("POST", { headers: { cookie, "content-type": "text/plain" } });
  assert.equal(wrongType.statusCode, 415);
  const tooLarge = await request("POST", {
    headers: { cookie, "content-type": "application/json", "content-length": "1025" }
  });
  assert.equal(tooLarge.statusCode, 413);
});

test("POST uses cookie identity and atomically preserves the best score", async () => {
  configure();
  const cookie = await session();
  const id = cookie.split("=")[1].split(".")[0];
  global.fetch = async (url, options) => {
    const command = JSON.parse(options.body);
    assert.match(command[1], /math\.max\(cleared, cjson\.decode\(previous\)\.cleared\)/);
    assert.deepEqual(command.slice(5), [id, "Alice", "12"]);
    return { ok: true, json: async () => ({ result: JSON.stringify({ id, name: "Alice", cleared: 20 }) }) };
  };
  const res = await request("POST", {
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ id: "someone-else", name: " Alice ", cleared: 12 })
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.player.id, id);
  assert.equal(res.body.player.cleared, 20);
});

test("Vercel KV-compatible variable names are supported", async () => {
  configure();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.KV_REST_API_URL = "https://kv.example";
  process.env.KV_REST_API_TOKEN = "kv-token";
  global.fetch = async (url, options) => {
    assert.equal(url, "https://kv.example");
    assert.equal(options.headers.Authorization, "Bearer kv-token");
    return { ok: true, json: async () => ({ result: [] }) };
  };
  assert.equal((await request()).statusCode, 200);
});

test("storage errors are explicit and never return a success-shaped empty list", async () => {
  configure();
  for (const fetcher of [
    async () => ({ ok: false, status: 401 }),
    async () => ({ ok: true, json: async () => ({ error: "ERR" }) }),
    async () => { throw new Error("network unavailable"); },
    async () => ({ ok: true, json: async () => ({ result: ["invalid JSON"] }) })
  ]) {
    global.fetch = fetcher;
    const res = await request();
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.error, "storage_unavailable");
    assert.equal(res.body.players, undefined);
  }
});
