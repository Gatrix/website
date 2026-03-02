"use server";

import { hash } from "bcryptjs";
import { signIn } from "@/auth";
import { invalidateUsersCache } from "@/lib/data/users";
import { readJson, writeJson } from "@/lib/storage-client";
import type { UserRecord } from "@/lib/data/users";

export async function register(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const users = (await readJson<UserRecord[]>("users.json")) ?? [];

    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { error: "Пользователь с таким email уже существует" };
    }

    const passwordHash = await hash(password, 10);
    const newUser: UserRecord = {
      id: `user-${Date.now()}`,
      email,
      passwordHash,
      player_name: email.split("@")[0],
      avatar_url: null,
      games_count: 0,
      level: 1,
    };

    users.push(newUser);
    await writeJson("users.json", users);
    invalidateUsersCache();

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (err) {
    console.error("Registration error:", err);
    return { error: err instanceof Error ? err.message : "Ошибка регистрации" };
  }
}
