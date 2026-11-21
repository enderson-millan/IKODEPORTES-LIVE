/* eslint-disable prettier/prettier */
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RankRow } from "@/lib/types";

interface RankingViewRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  hits: number;
  exact_hits: number;
  points: number;
}

/**
 * Computes initials from a display name.
 * Takes the first letter of the first two words, uppercased.
 * Falls back to "?" if no name is available.
 */
function computeAvatarFallback(displayName: string | null): string {
  if (!displayName) return "?";

  const parts = displayName.trim().split(/\s+/);
  const initials = parts
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return initials || "?";
}

/**
 * Busca ranking completo com posição relativa do usuário logado.
 * Retorna top 50. Se o usuário estiver no top 50, marca `isMe: true` na linha correspondente.
 * Se não houver sessão, retorna o ranking sem marcação de `isMe`.
 */
export async function getRanking(): Promise<RankRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("ranking_view")
    .select("*")
    .order("points", { ascending: false })
    .order("hits", { ascending: false })
    .limit(50);

  if (error || !data) {
    return [];
  }

  // Fetch current user — no error thrown if unauthenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.id ?? null;

  const rows: RankRow[] = (data as RankingViewRow[]).map((row, index) => ({
    rank: index + 1,
    userId: row.user_id,
    name: row.display_name ?? "Anônimo",
    avatarUrl: row.avatar_url ?? undefined,
    avatarFallback: computeAvatarFallback(row.display_name),
    points: row.points ?? 0,
    hits: row.hits ?? 0,
    exactHits: row.exact_hits ?? 0,
    trend: "flat",
    isMe: currentUserId !== null && row.user_id === currentUserId,
  }));

  return rows;
}
