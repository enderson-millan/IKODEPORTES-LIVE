"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface LiveStream {
  id: string;
  match_id: string;
  youtube_video_id: string;
  label: string;
  is_active: boolean;
}

/**
 * Fetches all active live streams from Supabase.
 * Refetches every 60s to pick up new streams added by admin during the day.
 */
export function useLiveStreams() {
  return useQuery<LiveStream[]>({
    queryKey: ["live-streams"],
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("live_streams")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
