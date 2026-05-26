import { readFileSync } from "fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
const migration = readFileSync("db/seed/adventure-gamesystems-migration.sql", "utf8");
const seed = readFileSync("db/seed/adventure-gamesystems.sql", "utf8");

try {
  await pool.query(migration);
  console.log("Migration OK");
  await pool.query(seed);
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM adventure_gamesystems");
  console.log(`Seed OK, rows: ${rows[0].n}`);
} finally {
  await pool.end();
}
