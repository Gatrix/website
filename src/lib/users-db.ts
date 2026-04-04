import { getDbPool } from "@/lib/pg-pool";
import type { UserRecord } from "@/lib/data/users";

function usersTable(): string {
  const t = (process.env.PG_USERS_TABLE || "users").trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t)) {
    throw new Error("PG_USERS_TABLE must match /^[a-zA-Z_][a-zA-Z0-9_]*$/");
  }
  return t;
}

function rowToUser(row: Record<string, unknown>): UserRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    player_name: row.player_name != null ? String(row.player_name) : null,
    avatar_url: row.avatar_url != null ? String(row.avatar_url) : null,
    games_count: Number(row.games_count ?? 0),
    level: Number(row.level ?? 1),
  };
}

export async function dbFindUserByEmail(email: string): Promise<UserRecord | null> {
  const pool = getDbPool();
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, player_name, avatar_url, games_count, level
     FROM ${usersTable()} WHERE lower(trim(email)) = lower(trim($1)) LIMIT 1`,
    [email]
  );
  if (rows.length === 0) return null;
  return rowToUser(rows[0] as Record<string, unknown>);
}

export async function dbGetUserById(id: string): Promise<UserRecord | null> {
  const pool = getDbPool();
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, player_name, avatar_url, games_count, level
     FROM ${usersTable()} WHERE id = $1 LIMIT 1`,
    [id]
  );
  if (rows.length === 0) return null;
  return rowToUser(rows[0] as Record<string, unknown>);
}

export async function dbInsertUser(user: UserRecord): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `INSERT INTO ${usersTable()} (id, email, password_hash, player_name, avatar_url, games_count, level)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      user.id,
      user.email,
      user.passwordHash,
      user.player_name,
      user.avatar_url,
      user.games_count,
      user.level,
    ]
  );
}

export async function dbUpdateUserProfile(
  id: string,
  patch: { player_name?: string | null; avatar_url?: string | null }
): Promise<UserRecord | null> {
  const pool = getDbPool();
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (patch.player_name !== undefined) {
    sets.push(`player_name = $${i++}`);
    vals.push(patch.player_name);
  }
  if (patch.avatar_url !== undefined) {
    sets.push(`avatar_url = $${i++}`);
    vals.push(patch.avatar_url);
  }
  if (sets.length === 0) return dbGetUserById(id);
  vals.push(id);
  await pool.query(
    `UPDATE ${usersTable()} SET ${sets.join(", ")} WHERE id = $${i}`,
    vals
  );
  return dbGetUserById(id);
}

export async function dbUpdateUserPassword(id: string, passwordHash: string): Promise<boolean> {
  const pool = getDbPool();
  const { rowCount } = await pool.query(
    `UPDATE ${usersTable()} SET password_hash = $1 WHERE id = $2`,
    [passwordHash, id]
  );
  return (rowCount ?? 0) > 0;
}
