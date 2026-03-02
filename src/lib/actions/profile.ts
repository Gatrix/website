"use server";

import { hash } from "bcryptjs";
import { auth } from "@/auth";
import type { Profile } from "@/lib/db";
import type { UserRecord } from "@/lib/data/users";
import { invalidateUsersCache } from "@/lib/data/users";
import { readJson, writeJson } from "@/lib/storage-client";

function userToProfile(u: UserRecord): Profile {
  return {
    id: u.id,
    user_id: u.id,
    player_name: u.player_name,
    avatar_url: u.avatar_url,
    games_count: u.games_count,
    level: u.level,
  };
}

export async function getProfile(): Promise<Profile | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  try {
    const users = (await readJson<UserRecord[]>("users.json")) ?? [];
    const user = users.find((u) => u.id === userId);
    return user ? userToProfile(user) : null;
  } catch (err) {
    console.error("Error fetching profile:", err);
    return null;
  }
}

export async function createProfile(profileData: Partial<Profile>): Promise<Profile | null> {
  const session = await auth();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  if (!userId) return null;

  try {
    const users = (await readJson<UserRecord[]>("users.json")) ?? [];
    const user = users.find((u) => u.id === userId);
    if (user) return userToProfile(user);

    const newUser: UserRecord = {
      id: userId,
      email: userEmail || "",
      passwordHash: "",
      player_name: profileData.player_name || userEmail?.split("@")[0] || "Игрок",
      avatar_url: profileData.avatar_url || null,
      games_count: 0,
      level: 1,
    };
    users.push(newUser);
    await writeJson("users.json", users);
    invalidateUsersCache();
    return userToProfile(newUser);
  } catch (err) {
    console.error("Error creating profile:", err);
    return null;
  }
}

export async function updateProfile(profileData: Partial<Profile>): Promise<Profile | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  try {
    const users = (await readJson<UserRecord[]>("users.json")) ?? [];
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) return null;

    if (profileData.player_name !== undefined) users[idx].player_name = profileData.player_name;
    if (profileData.avatar_url !== undefined) users[idx].avatar_url = profileData.avatar_url;

    await writeJson("users.json", users);
    invalidateUsersCache();
    return userToProfile(users[idx]);
  } catch (err) {
    console.error("Error updating profile:", err);
    return null;
  }
}

export async function changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "Не авторизован" };

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Пароль должен содержать минимум 6 символов" };
  }

  try {
    const users = (await readJson<UserRecord[]>("users.json")) ?? [];
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) return { success: false, error: "Пользователь не найден" };

    users[idx].passwordHash = await hash(newPassword, 10);
    await writeJson("users.json", users);
    invalidateUsersCache();
    return { success: true };
  } catch (err) {
    console.error("Error changing password:", err);
    return { success: false, error: "Ошибка при смене пароля" };
  }
}
