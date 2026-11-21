/* eslint-disable prettier/prettier */
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Pick } from "@/lib/types";

/**
 * Retorna um mapa de todos os palpites do usuário autenticado.
 * Chave: espn_event_id, Valor: Pick { teamId, scoreA?, scoreB? }
 */
export async function getPicks(): Promise<
  Record<string, Pick> | { success: false; error: string }
> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "unauthorized" };
  }

  const { data, error } = await supabase
    .from("picks")
    .select("espn_event_id, team_id, score_a, score_b")
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  const picksMap: Record<string, Pick> = {};

  for (const row of data ?? []) {
    picksMap[row.espn_event_id] = {
      teamId: row.team_id,
      ...(row.score_a != null ? { scoreA: row.score_a } : {}),
      ...(row.score_b != null ? { scoreB: row.score_b } : {}),
    };
  }

  return picksMap;
}

/**
 * Salva ou atualiza um palpite do usuário autenticado (upsert).
 * scoreA e scoreB são opcionais — usuário pode palpitar só o vencedor.
 */
export async function savePick(
  espnEventId: string,
  teamId: string,
  scoreA?: number,
  scoreB?: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "unauthorized" };
  }

  const { error } = await supabase.from("picks").upsert(
    {
      user_id: user.id,
      espn_event_id: espnEventId,
      team_id: teamId,
      score_a: scoreA ?? null,
      score_b: scoreB ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,espn_event_id" },
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
