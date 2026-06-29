import { useCallback, useEffect, useState } from "react";
import { supabase, FREE_SCAN_LIMIT } from "./supabase";

export interface Scan {
  id: string;
  image_url: string;
  target_language: string;
  translated_text: string | null;
  summary: string | null;
  created_at: string;
}

export function useScans(userId: string | null) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = useCallback(async () => {
    if (!userId) {
      setScans([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching scans:", error);
      setScans([]);
    } else {
      setScans(data as Scan[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const scansUsed = scans.length;
  const scansRemaining = Math.max(0, FREE_SCAN_LIMIT - scansUsed);
  const limitReached = scansUsed >= FREE_SCAN_LIMIT;

  return { scans, scansUsed, scansRemaining, limitReached, loading, refresh: fetchScans };
}
