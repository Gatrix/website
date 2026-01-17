"use server";

import { supabase } from "@/lib/supabase";
import { auth } from "@/auth";
import type { Profile } from "@/lib/db";

export async function getProfile(): Promise<Profile | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

export async function createProfile(profileData: Partial<Profile>): Promise<Profile | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert([{
        user_id: session.user.id,
        player_name: profileData.player_name || session.user.email?.split("@")[0] || "Игрок",
        avatar_url: profileData.avatar_url || null,
        games_count: 0,
        level: 1
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating profile:", error);
    return null;
  }
}

export async function updateProfile(profileData: Partial<Profile>): Promise<Profile | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        player_name: profileData.player_name,
        avatar_url: profileData.avatar_url
      })
      .eq("user_id", session.user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    return null;
  }
}
