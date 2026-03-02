import { readJson } from "@/lib/storage-client";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  player_name: string | null;
  avatar_url: string | null;
  games_count: number;
  level: number;
}

let usersCache: UserRecord[] | null = null;

export function invalidateUsersCache() {
  usersCache = null;
}

export async function loadUsers(): Promise<UserRecord[]> {
  if (usersCache) return usersCache;
  try {
    const data = await readJson<UserRecord[]>("users.json");
    usersCache = Array.isArray(data) ? data : [];
    return usersCache;
  } catch (err) {
    console.error("Error loading users.json:", err);
    return [];
  }
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await loadUsers();
  const normalized = email.toLowerCase().trim();
  return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}
