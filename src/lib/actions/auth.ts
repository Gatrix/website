"use server";

import { hash } from "bcryptjs";
import { signIn } from "@/auth";
import { invalidateUsersCache } from "@/lib/data/users";
import type { UserRecord } from "@/lib/data/users";
import { dbFindUserByEmail, dbInsertUser } from "@/lib/users-db";

export async function register(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const exists = await dbFindUserByEmail(email);
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

    await dbInsertUser(newUser);
    invalidateUsersCache();

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg.code === "23505") {
      return { error: "Пользователь с таким email уже существует" };
    }
    console.error("Registration error:", err);
    return { error: err instanceof Error ? err.message : "Ошибка регистрации" };
  }
}
