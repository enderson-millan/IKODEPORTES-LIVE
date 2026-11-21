-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: score picks
-- Adds score prediction columns to `picks` and `match_results`,
-- then rebuilds `ranking_view` with tiered scoring.
--
-- Scoring tiers:
--   Correct winner only          → +10 pts
--   Correct winner + goal diff   → +10 + 5 bonus = 15 pts
--   Exact score                  → +10 + 5 + 15 bonus = 30 pts
--
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add score columns to picks
alter table public.picks
  add column if not exists score_a smallint,
  add column if not exists score_b smallint;

-- 2. Add actual score columns to match_results
alter table public.match_results
  add column if not exists score_a smallint,
  add column if not exists score_b smallint;

-- 3. Rebuild ranking_view with tiered scoring
--    Must drop first: Postgres does not allow reordering/renaming columns via CREATE OR REPLACE
drop view if exists public.ranking_view;
create view public.ranking_view as
select
  p.user_id,
  u.raw_user_meta_data ->> 'full_name'  as display_name,
  u.raw_user_meta_data ->> 'avatar_url' as avatar_url,

  -- hits: picked the correct winner
  count(*) filter (
    where mr.winner_team_id is not null
      and p.team_id = mr.winner_team_id
  )::int as hits,

  -- exact_hits: picked correct winner AND exact score
  count(*) filter (
    where mr.winner_team_id is not null
      and p.team_id  = mr.winner_team_id
      and p.score_a  is not null
      and p.score_b  is not null
      and mr.score_a is not null
      and mr.score_b is not null
      and p.score_a  = mr.score_a
      and p.score_b  = mr.score_b
  )::int as exact_hits,

  -- points: tiered
  (
    -- base: 10 pts per correct winner
    count(*) filter (
      where mr.winner_team_id is not null
        and p.team_id = mr.winner_team_id
    ) * 10

    -- bonus +5 per correct goal difference (winner must also be correct)
    + count(*) filter (
      where mr.winner_team_id is not null
        and p.team_id  = mr.winner_team_id
        and p.score_a  is not null
        and p.score_b  is not null
        and mr.score_a is not null
        and mr.score_b is not null
        and (p.score_a - p.score_b) = (mr.score_a - mr.score_b)
    ) * 5

    -- bonus +15 per exact score (winner must also be correct)
    + count(*) filter (
      where mr.winner_team_id is not null
        and p.team_id  = mr.winner_team_id
        and p.score_a  is not null
        and p.score_b  is not null
        and mr.score_a is not null
        and mr.score_b is not null
        and p.score_a  = mr.score_a
        and p.score_b  = mr.score_b
    ) * 15
  )::int as points

from public.picks p
join auth.users u on u.id = p.user_id
left join public.match_results mr on mr.espn_event_id = p.espn_event_id
group by p.user_id, display_name, avatar_url
order by points desc, hits desc;
