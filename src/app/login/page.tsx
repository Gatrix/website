"use client";

import React from "react";
import Link from "next/link";
import AtmosphericBackground from "@/components/AtmosphericBackground";

/* TODO: раскомментировать при включении авторизации
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import { register } from "@/lib/actions/auth";
import { signIn } from "next-auth/react";
... (полная форма входа/регистрации)
*/

export default function LoginPage() {
  return (
    <main className="relative min-h-screen text-[#d1c7bc] font-serif selection:bg-amber-900/50 flex items-center justify-center px-4 py-20">
      <AtmosphericBackground />

      <div className="relative w-full max-w-md text-center">
        <div className="absolute -inset-4 bg-amber-900/10 border-2 border-amber-700/30 -rotate-1"></div>
        <div className="absolute -inset-2 bg-amber-900/5 border border-amber-700/20 rotate-1"></div>

        <div className="relative bg-[#0f0d0c]/95 backdrop-blur-sm border-2 border-amber-700/40 p-8 sm:p-10 shadow-2xl">
          <h1 className="text-xl font-bold text-amber-100 uppercase tracking-wider mb-4">
            Временно недоступно
          </h1>
          <p className="text-amber-600/80 text-sm mb-6">
            Авторизация и личные кабинеты отключены. Раскомментируйте код в <code className="text-amber-500">src/app/login/page.tsx</code> и <code className="text-amber-500">README.md</code>.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-amber-900/20 border-2 border-amber-700/50 text-amber-500 font-black uppercase tracking-wider hover:bg-amber-700 hover:text-black transition-all"
          >
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
