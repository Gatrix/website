import React from "react";
import { getAdventures } from "@/lib/actions/adventures";
import HomeClient from "./HomeClient";

// Помечаем страницу как динамическую, чтобы она всегда запрашивала свежие данные
export const revalidate = 3600; // Ревалидация раз в час или по необходимости

export default async function Home() {
  // Получаем данные прямо на сервере
  // Это исключает "бесконечную загрузку" на клиенте
  const adventures = await getAdventures();

  return <HomeClient initialAdventures={adventures} />;
}
