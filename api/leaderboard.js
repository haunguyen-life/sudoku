const { createHmac, randomUUID, timingSafeEqual } = require("node:crypto");

const COOKIE = "sudoku_player";
const RANKING = "minisudoku:v1:ranking";
const PLAYERS = "minisudoku:v1:players";
const READ = `
local ids = redis.call("ZRANGE", KEYS[1], 0, 99, "REV")
local rows = {}
for _, id in ipairs(ids) do
  local player = redis.call("HGET", KEYS[2], id)
  if player then table.insert(rows, player) end
end
return rows
`;
const WRITE = `
local previous = redis.call("HGET", KEYS[2], ARGV[1])
local cleared = tonumber(ARGV[3])
if previous then cleared = math.max(cleared, cjson.decode(previous).cleared) end
local player = cjson.encode({id = ARGV[1], name = ARGV[2], cleared = cleared})
redis.call("HSET", KEYS[2], ARGV[1], player)
redis.call("ZADD", KEYS[1], cleared, ARGV[1])
return player
`;

function signature(id, secret) {
  return createHmac("sha256", secret).update("sudoku-player:" + id).digest("hex");
}

function playerId(req, secret) {
  const cookie = (req.headers.cookie || "").split(";").map(value => value.trim())
    .find(value => value.startsWith(COOKIE + "="));
  if (!cookie) return null;
  const match = /^([a-f0-9-]{36})\.([a-f0-9]{64})$/.exec(cookie.slice(COOKIE.length + 1));
  if (!match) return null;
  return timingSafeEqual(Buffer.from(match[2], "hex"), Buffer.from(signature(match[1], secret), "hex"))
    ? match[1] : null;
}

async function redis(url, token, script, args = []) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(["EVAL", script, "2", RANKING, PLAYERS, ...args]),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error("Redis HTTP " + response.status);
  const body = await response.json();
  if (body.error) throw new Error("Redis command failed");
  return body.result;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Vary", "Cookie");
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    return res.status(503).json({ error: "not_configured" });
  }
  let id = playerId(req, token);
  let payload;
  if (req.method === "POST") {
    if (!id) return res.status(401).json({ error: "session_required" });
    if (!(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
      return res.status(415).json({ error: "invalid_content_type" });
    }
    if (Number(req.headers["content-length"]) > 1024) {
      return res.status(413).json({ error: "payload_too_large" });
    }
    try {
      payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: "invalid_score" });
    }
    if (!payload || typeof payload.name !== "string" ||
        !payload.name.trim() || payload.name.length > 16 ||
        !Number.isInteger(payload.cleared) || payload.cleared < 1 || payload.cleared > 200) {
      return res.status(400).json({ error: "invalid_score" });
    }
  }
  try {
    if (req.method === "POST") {
      const result = await redis(url, token, WRITE, [id, payload.name.trim(), String(payload.cleared)]);
      return res.status(200).json({ player: JSON.parse(result) });
    }
    const rows = await redis(url, token, READ);
    const players = rows.map(row => JSON.parse(row));
    if (!id) {
      id = randomUUID();
      const secure = process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
      res.setHeader("Set-Cookie", COOKIE + "=" + id + "." + signature(id, token) +
        "; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000" + secure);
    }
    return res.status(200).json({ playerId: id, players });
  } catch (error) {
    console.error("Leaderboard storage request failed:", error.name);
    return res.status(503).json({ error: "storage_unavailable" });
  }
};
