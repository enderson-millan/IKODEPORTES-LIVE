-- ─── live_streams table ──────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor to enable the /live feature.
--
-- Each row links an ESPN match ID to a YouTube video ID.
-- A match can have multiple streams (e.g. CazéTV + Globo).
-- The component always shows is_active = true rows for LIVE matches.

create table if not exists public.live_streams (
  id              uuid primary key default gen_random_uuid(),
  match_id        text not null,          -- ESPN event ID (e.g. "760487")
  youtube_video_id text not null,         -- YouTube video ID (e.g. "dQw4w9WgXcQ")
  label           text not null default 'CazéTV',  -- display label
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index for fast lookup by match_id
create index if not exists live_streams_match_id_idx on public.live_streams (match_id);

-- RLS: anyone authenticated can read; only service role / admin can insert/update
alter table public.live_streams enable row level security;

create policy "live_streams_read_authenticated"
  on public.live_streams for select
  to authenticated
  using (true);

-- Example insert (replace video IDs before each match):
-- insert into public.live_streams (match_id, youtube_video_id, label)
-- values ('760487', 'YOUTUBE_VIDEO_ID_HERE', 'CazéTV');
