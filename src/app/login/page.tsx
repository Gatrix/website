"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AtmosphericBackground from "@/components/AtmosphericBackground";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        // После регистрации перенаправляем на профиль
        router.push("/profile");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        // После входа перенаправляем на профиль
        router.push("/profile");
      }
    } catch (err: any) {
      setError(err.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen text-[#d1c7bc] font-serif selection:bg-amber-900/50 flex items-center justify-center px-4 py-20">
      <AtmosphericBackground />

      <div className="relative w-full max-w-md">
        {/* Декоративная рамка в стиле старой меди */}
        <div className="absolute -inset-4 bg-amber-900/10 border-2 border-amber-700/30 -rotate-1"></div>
        <div className="absolute -inset-2 bg-amber-900/5 border border-amber-700/20 rotate-1"></div>
        
        <div className="relative bg-[#0f0d0c]/95 backdrop-blur-sm border-2 border-amber-700/40 p-8 sm:p-10 shadow-2xl">
          {/* Переключатель */}
          <div className="flex gap-2 mb-8 justify-center">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                !isSignUp
                  ? "bg-amber-700/30 border-2 border-amber-600 text-amber-300"
                  : "bg-amber-900/10 border-2 border-amber-700/30 text-amber-600/70 hover:border-amber-700/50"
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError(null);
              }}
              className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                isSignUp
                  ? "bg-amber-700/30 border-2 border-amber-600 text-amber-300"
                  : "bg-amber-900/10 border-2 border-amber-700/30 text-amber-600/70 hover:border-amber-700/50"
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold uppercase tracking-wider text-amber-600 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#1a1614] border-2 border-amber-700/40 text-amber-50 placeholder:text-amber-700/50 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 transition-all font-serif"
                placeholder="ваш@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold uppercase tracking-wider text-amber-600 mb-2"
              >
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#1a1614] border-2 border-amber-700/40 text-amber-50 placeholder:text-amber-700/50 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 transition-all font-serif"
                placeholder="••••••••"
              />
            </div>

            {/* Ошибка */}
            {error && (
              <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Кнопка */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-amber-900/20 border-2 border-amber-700/50 text-amber-500 font-black uppercase tracking-wider hover:bg-amber-700 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? "..." : isSignUp ? "Вступить в Гильдию" : "Войти в Гильдию"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
