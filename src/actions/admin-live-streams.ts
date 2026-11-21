/* eslint-disable prettier/prettier */
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LiveStreamRow {
  id: string;
  match_id: string | null;
  youtube_video_id: string;
  label: string;
  team_hint: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateLiveStreamInput {
  youtube_video_id: string;
  label: string;
  team_hint?: string;
  match_id?: string;
}

// ─── Auth guard ──────────────────────────────────────────────────────────────

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.email !== ADMIN_EMAIL) {
    throw new Error("Forbidden");
  }

  return user;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Returns all live_streams rows (active and inactive) — admin only.
 */
export async function getAdminLiveStreams(): Promise<
  LiveStreamRow[] | { success: false; error: string }
> {
  try {
    await assertAdmin();
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("live_streams")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return (data as LiveStreamRow[]) ?? [];
}

/**
 * Creates a new live_stream row — admin only.
 */
export async function createLiveStream(
  input: CreateLiveStreamInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("live_streams").insert({
    youtube_video_id: input.youtube_video_id.trim(),
    label: input.label.trim(),
    team_hint: input.team_hint?.trim().toUpperCase() || null,
    match_id: input.match_id?.trim() || null,
    is_active: true,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Toggles is_active for a live_stream — admin only.
 */
export async function toggleLiveStream(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("live_streams")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Deletes a live_stream row — admin only.
 */
export async function deleteLiveStream(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("live_streams").delete().eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Manually triggers the sync-results job — admin only.
 */
export async function triggerSyncResults(): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  try {
    await assertAdmin();
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return { success: false, error: "CRON_SECRET not configured" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/sync-results`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
