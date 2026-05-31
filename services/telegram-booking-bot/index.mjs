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

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в файле .env (в этой же папке)");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("Задайте DATABASE_URL в .env — подключение к adventurespool на этой ВМ");
  process.exit(1);
}

/** @param {string} text */
async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.description ?? `Telegram API ${res.status}`);
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

async function pollPendingRequests() {
  if (polling || stopping) return;
  polling = true;

  try {
    for (let i = 0; i < 20 && !stopping; i += 1) {
      const client = await pool.connect();
      let id = "";
      let hasRow = false;

      try {
        await client.query("BEGIN");
        const { rows } = await client.query(
          `SELECT
             id::text AS id,
             created_at,
             adventure_id,
             adventure_title,
             game_system_name,
             difficulty_name,
             universe_name,
             player_count,
             duration_hours,
             adventure_type,
             player_note,
             phone,
             warning_messages
           FROM booking_requests
           WHERE telegram_notified_at IS NULL
           ORDER BY id ASC
           LIMIT 1
           FOR UPDATE SKIP LOCKED`
        );

        const row = rows[0];
        if (!row) {
          await client.query("COMMIT");
          break;
        }

        hasRow = true;
        id = row.id;
        await notifyBooking(rowToBookingBody(row));
        await client.query(
          `UPDATE booking_requests
           SET telegram_notified_at = NOW()
           WHERE id = $1::bigint AND telegram_notified_at IS NULL`,
          [id]
        );
        await client.query("COMMIT");
      } catch (err) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackErr) {
          console.error("[poll] rollback failed:", rollbackErr);
        }
        if (hasRow) {
          console.error(`[poll] id=${id}:`, err);
        } else {
          console.error("[poll] select pending request:", err);
        }
        break;
      } finally {
        client.release();
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

console.log(`[poll] adventurespool.booking_requests, interval=${POLL_INTERVAL_MS}ms`);
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
