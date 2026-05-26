import { readFileSync } from "fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
const sql = readFileSync("db/seed/adventure-gametime-min-4h.sql", "utf8");

try {
  const del = await pool.query(sql);
  console.log("deleted rows:", del.rowCount);
  const { rows } = await pool.query(
    `SELECT MIN(CAST(gametime_id AS INT)) AS min_h, MAX(CAST(gametime_id AS INT)) AS max_h, COUNT(*)::int AS n FROM adventure_gametime`
  );
  console.log(rows[0]);
} finally {
  await pool.end();
}
