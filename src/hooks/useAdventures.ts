import { useState, useEffect } from "react";
import { getAdventures } from "@/lib/actions/adventures";
import type { Adventure } from "@/lib/db";

export { type Adventure };

export function useAdventures() {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAdventures() {
      setLoading(true);
      try {
        const data = await getAdventures();
        setAdventures(data);
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
