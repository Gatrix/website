"use server";

import { supabase } from "@/lib/supabase";
import type { Adventure } from "@/lib/db";

export async function getAdventures(): Promise<Adventure[]> {
  try {
    const { data, error } = await supabase
      .from("adventures")
      .select("*");
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching adventures:", error);
    return [];
  }
}

export async function getAdventureById(id: string): Promise<Adventure | null> {
  try {
    const { data, error } = await supabase
      .from("adventures")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching adventure ${id}:`, error);
    return null;
  }
}
