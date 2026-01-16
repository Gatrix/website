import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Adventure {
  id: string;
  title: string;
  poster?: string;
  img_url?: string;
  description?: string;
  genre?: string | string[];
  logline?: string;
  tone?: string | string[];
  difficulty?: "easy" | "medium" | "hard" | "expert" | string;
  format?: "oneshot" | "mini-campaign" | "campaign" | string;
  durationHours?: string;
  durationMinutes?: number;
  isBeginnerFriendly?: boolean;
  contentWarnings?: string[];
  highlights?: string[];
  benefits?: string[];
  ageRating?: string;
  price?: string;
  priceLabel?: string;
  hasUpcomingSlots7d?: boolean;
  playerCount?: { min: number; max: number };
  tags?: string | null;
  universe?: string | null;
  base_setting?: string;
  subsetting?: string;
  world?: string;
  focus?: string;
  players?: string;
  time?: string;
  [key: string]: any;
}

export function useAdventures() {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAdventures() {
      setLoading(true);
      try {
        const { data, error: supabaseError } = await supabase
          .from("adventures")
          .select("*");
        
        if (supabaseError) {
          setError(new Error(supabaseError.message));
          return;
        }
        
        if (data) {
          setAdventures(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    }
    
    fetchAdventures();
  }, []);

  return { adventures, loading, error };
}
