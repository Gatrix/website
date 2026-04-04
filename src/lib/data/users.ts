import { dbFindUserByEmail } from "@/lib/users-db";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  player_name: string | null;
  avatar_url: string | null;
  games_count: number;
  level: number;
}

/** Заглушка: данные в PostgreSQL, отдельного кеша списка пользователей нет. */
export function invalidateUsersCache() {}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  return dbFindUserByEmail(email);
}
