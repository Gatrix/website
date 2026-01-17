"use server";

import { supabase } from "@/lib/supabase";
import type { Adventure } from "@/lib/db";
import { fallbackAdventures, getFallbackAdventureById } from "@/lib/fallbackAdventures";

const SUPABASE_TIMEOUT_MS = 3500;

const timeoutResult = (ms: number) =>
  new Promise<{ data: null; error: Error }>((resolve) => {
    setTimeout(() => resolve({ data: null, error: new Error("Supabase timeout") }), ms);
  });

export async function getAdventures(): Promise<Adventure[]> {
  try {
    const { data, error } = await Promise.race([
      supabase.from("adventures").select("*"),
      timeoutResult(SUPABASE_TIMEOUT_MS),
    ]);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching adventures:", error);
    return fallbackAdventures;
  }
}

export async function getAdventureById(id: string): Promise<Adventure | null> {
  try {
    const { data, error } = await Promise.race([
      supabase.from("adventures").select("*").eq("id", id).single(),
      timeoutResult(SUPABASE_TIMEOUT_MS),
    ]);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching adventure ${id}:`, error);
    return getFallbackAdventureById(id);
  }
}
