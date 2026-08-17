import { spawn } from "node:child_process";
import pg from "pg";
import { formatBookingMessage } from "./format-message.mjs";
import { loadEnvFile } from "./load-env.mjs";
import { rowToBookingBody } from "./row-to-message.mjs";

loadEnvFile();

function env(name, fallback = "") {
  return (process.env[name] ?? fallback).trim();
}

const BOT_TOKEN = env("TELEGRAM_BOT_TOKEN");
const CHAT_ID = env("TELEGRAM_CHAT_ID");
const DATABASE_URL = env("DATABASE_URL");
const POLL_INTERVAL_MS = Number(env("POLL_INTERVAL_MS", "15000"));
const API_BASE = env("TELEGRAM_API_BASE", "https://api.telegram.org").replace(/\/+$/, "");
const SOCKS_PROXY = env("TELEGRAM_SOCKS_PROXY");

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в файле .env (в этой же папке)");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("Задайте DATABASE_URL в .env — подключение к adventurespool на этой ВМ");
  process.exit(1);
}

/** @param {string} url @param {string} payload */
async function sendViaFetch(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    signal: AbortSignal.timeout(25000),
  });
  return res.json();
}

/**
 * @param {string} url
 * @param {string} payload
 * @param {string} socks host:port
 */
function sendViaCurl(url, payload, socks) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "curl",
      [
        "-sS",
        "--max-time",
        "25",
        "-H",
        "Content-Type: application/json",
        "-d",
        payload,
        "--proxy",
        `socks5h://${socks}`,
        url,
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `curl exited ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error("Telegram response is not JSON"));
      }
    });
  });
}

/** @param {string} text */
async function sendTelegram(text) {
  const url = `${API_BASE}/bot${BOT_TOKEN}/sendMessage`;
  const payload = JSON.stringify({
    chat_id: CHAT_ID,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
  const data = SOCKS_PROXY
    ? await sendViaCurl(url, payload, SOCKS_PROXY)
    : await sendViaFetch(url, payload);
  if (!data?.ok) {
    throw new Error(data?.description ?? "Telegram API error");
  }
}

/** @param {Record<string, unknown>} body */
async function notifyBooking(body) {
  const text = formatBookingMessage(body);
  await sendTelegram(text);
  console.log("[notify] sent:", body.adventureTitle ?? body.adventureId);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });
let polling = false;
let stopping = false;

async function markNotified(id) {
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE booking_requests
       SET telegram_notified_at = NOW()
       WHERE id = $1::bigint AND telegram_notified_at IS NULL`,
      [id]
    );
  } finally {
    client.release();
  }
}

async function pollPendingRequests() {
  if (polling || stopping) return;
  polling = true;

  try {
    for (let i = 0; i < 20 && !stopping; i += 1) {
      let client = await pool.connect();
      let id = "";
      let hasRow = false;
      let released = false;

      try {
        await client.query("BEGIN");
        const { rows } = await client.query(
          `SELECT
             br.id::text AS id,
             br.created_at,
             br.adventure_id,
             br.adventure_title,
             br.game_system_name,
             br.difficulty_name,
             br.universe_name,
             br.player_count,
             br.duration_hours,
             br.adventure_type,
             br.player_note,
             br.phone,
             br.warning_messages,
             COALESCE(br.starts_at, bs.starts_at) AS starts_at,
             bs.ends_at
           FROM booking_requests br
           LEFT JOIN booking_schedule bs
             ON bs.booking_request_id = br.id AND bs.status <> 'cancelled'
           WHERE br.telegram_notified_at IS NULL
           ORDER BY br.id ASC
           LIMIT 1
           FOR UPDATE OF br SKIP LOCKED`
        );

        const row = rows[0];
        if (!row) {
          await client.query("COMMIT");
          break;
        }

        hasRow = true;
        id = row.id;
        const body = rowToBookingBody(row);
        await client.query("COMMIT");
        client.release();
        released = true;

        try {
          await notifyBooking(body);
          await markNotified(id);
        } catch (sendErr) {
          console.error(`[poll] telegram send failed id=${id}:`, sendErr);
        }
      } catch (err) {
        if (!released) {
          try {
            await client.query("ROLLBACK");
          } catch (rollbackErr) {
            console.error("[poll] rollback failed:", rollbackErr);
          }
        }
        if (hasRow) {
          console.error(`[poll] id=${id}:`, err);
        } else {
          console.error("[poll] select pending request:", err);
        }
        continue;
      } finally {
        if (!released) {
          client.release();
        }
      }
    }
  } finally {
    polling = false;
  }
}

async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  clearInterval(interval);
  console.log(`[poll] ${signal}: shutting down`);
  try {
    await pool.end();
  } catch (err) {
    console.error("[poll] pool shutdown:", err);
    process.exit(1);
  }
  process.exit(0);
}

console.log(
  `[poll] adventurespool.booking_requests, interval=${POLL_INTERVAL_MS}ms, telegram=${SOCKS_PROXY ? `socks ${SOCKS_PROXY}` : "direct"}`
);
await pollPendingRequests();
const interval = setInterval(() => {
  void pollPendingRequests();
}, POLL_INTERVAL_MS);

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
