import { Pool } from "pg";

const globalForPool = globalThis as unknown as { dbPool: Pool | undefined };

export function getDbPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForPool.dbPool) {
    globalForPool.dbPool = new Pool({
      connectionString: url,
      max: Number(process.env.PG_POOL_MAX ?? 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    });
  }
  return globalForPool.dbPool;
}
