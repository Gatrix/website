"use server";

import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { auth } from "@/auth";
import type { Profile } from "@/lib/db";
import type { UserRecord } from "@/lib/data/users";
import { invalidateUsersCache } from "@/lib/data/users";
import {
  dbGetUserById,
  dbInsertUser,
  dbUpdateUserPassword,
  dbUpdateUserProfile,
} from "@/lib/users-db";

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
    const user = await dbGetUserById(userId);
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
    const existing = await dbGetUserById(userId);
    if (existing) return userToProfile(existing);

    const ghostHash = await hash(randomUUID(), 10);
    const newUser: UserRecord = {
      id: userId,
      email: userEmail || "",
      passwordHash: ghostHash,
      player_name: profileData.player_name || userEmail?.split("@")[0] || "Игрок",
      avatar_url: profileData.avatar_url || null,
      games_count: 0,
      level: 1,
    };
    await dbInsertUser(newUser);
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
    const updated = await dbUpdateUserProfile(userId, {
      player_name: profileData.player_name,
      avatar_url: profileData.avatar_url,
    });
    invalidateUsersCache();
    return updated ? userToProfile(updated) : null;
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
    const passwordHash = await hash(newPassword, 10);
    const ok = await dbUpdateUserPassword(userId, passwordHash);
    if (!ok) return { success: false, error: "Пользователь не найден" };
    invalidateUsersCache();
    return { success: true };
  } catch (err) {
    console.error("Error changing password:", err);
    return { success: false, error: "Ошибка при смене пароля" };
  }
}
