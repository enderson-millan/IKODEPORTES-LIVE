-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: live_streams auto-link via team_hint
--
-- Changes:
--   1. match_id → nullable (allows pre-inserting streams before the match starts)
--   2. team_hint → new column (abbreviation used by the cron to auto-link the match)
--
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Make match_id nullable
alter table public.live_streams
  alter column match_id drop not null;

-- 2. Add team_hint column (ESPN abbreviation, e.g. 'BEL', 'SEN', 'BRA')
alter table public.live_streams
  add column if not exists team_hint text;
