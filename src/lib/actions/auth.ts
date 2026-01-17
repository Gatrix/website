"use server";

import { supabase } from "@/lib/supabase";
import { signIn } from "@/auth";

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    // Регистрируем пользователя в Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("Ошибка регистрации");

    // Создаем профиль в вашей таблице profiles (если это не делается триггером в Supabase)
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([{
        user_id: data.user.id,
        player_name: email.split("@")[0],
        level: 1,
        games_count: 0
      }]);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Не выбрасываем ошибку, так как пользователь уже создан в Auth
    }

    // Входим через NextAuth
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: error.message || "Something went wrong" };
  }
}
