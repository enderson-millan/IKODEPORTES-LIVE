-- ─────────────────────────────────────────────────────────────────────────────
-- Fix completo: match_results + ranking_view
--
-- PROBLEMA RAIZ IDENTIFICADO:
--   1. A tabela match_results foi criada sem as colunas score_a e score_b.
--   2. O sync-results tenta fazer upsert com score_a/score_b → falha silenciosamente.
--   3. match_results fica vazia → winner_team_id = NULL nos palpites (LEFT JOIN sem match).
--   4. ranking_view calcula 0 pontos para todos.
--
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR:
-- Dashboard → SQL Editor → New query → Cole tudo → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── PASSO 1: Adicionar colunas de placar nas duas tabelas ─────────────────────
-- Idempotente — não falha se já existirem.

alter table public.picks
  add column if not exists score_a smallint,
  add column if not exists score_b smallint;

alter table public.match_results
  add column if not exists score_a smallint,
  add column if not exists score_b smallint;

-- ── PASSO 2: Inserir os resultados reais de todos os jogos R32 já encerrados ──
-- Dados obtidos direto da ESPN API em 01/07/2026.
-- score_a = placar do time order=0 (home/teamA)
-- score_b = placar do time order=1 (away/teamB)
-- winner_team_id = ESPN team id do vencedor
--
-- 760486: RSA(467) 0-1 CAN(206)   → Canadá vence   FT
-- 760487: BRA(205) 2-1 JPN(627)   → Brasil vence   FT
-- 760489: GER(481) 1-1 PAR(210)   → Paraguai vence PEN
-- 760488: NED(449) 1-1 MAR(2869)  → Marrocos vence PEN
-- 760490: CIV(4789) 1-2 NOR(464)  → Noruega vence  FT
-- 760492: FRA(478) 3-0 SWE(466)   → França vence   FT
-- 760491: MEX(203) 2-0 ECU(209)   → México vence   FT
-- 760495: ENG(448) 2-1 COD(2850)  → Inglaterra vence FT
-- 760493: BEL(459) 3-2 SEN(654)   → Bélgica vence  AET

insert into public.match_results (espn_event_id, winner_team_id, score_a, score_b, stage, updated_at)
values
  ('760486', '206',  0, 1, 'r32', now()),
  ('760487', '205',  2, 1, 'r32', now()),
  ('760489', '210',  1, 1, 'r32', now()),
  ('760488', '2869', 1, 1, 'r32', now()),
  ('760490', '464',  1, 2, 'r32', now()),
  ('760492', '478',  3, 0, 'r32', now()),
  ('760491', '203',  2, 0, 'r32', now()),
  ('760495', '448',  2, 1, 'r32', now()),
  ('760493', '459',  3, 2, 'r32', now())
on conflict (espn_event_id)
do update set
  winner_team_id = excluded.winner_team_id,
  score_a        = excluded.score_a,
  score_b        = excluded.score_b,
  stage          = excluded.stage,
  updated_at     = excluded.updated_at;

-- ── PASSO 3: Recriar a ranking_view definitiva ────────────────────────────────
-- SECURITY DEFINER: necessário para acessar auth.users via anon key
-- Tiered scoring: +10 vencedor | +5 diff gols | +15 placar exato

drop view if exists public.ranking_view;

create view public.ranking_view
  with (security_invoker = false)
as
select
  p.user_id,
  u.raw_user_meta_data ->> 'full_name'  as display_name,
  u.raw_user_meta_data ->> 'avatar_url' as avatar_url,

  -- hits: acertou o vencedor
  count(*) filter (
    where mr.winner_team_id is not null
      and p.team_id = mr.winner_team_id
  )::int as hits,

  -- exact_hits: acertou vencedor + placar exato
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
    count(*) filter (
      where mr.winner_team_id is not null
        and p.team_id = mr.winner_team_id
    ) * 10

    + count(*) filter (
      where mr.winner_team_id is not null
        and p.team_id  = mr.winner_team_id
        and p.score_a  is not null
        and p.score_b  is not null
        and mr.score_a is not null
        and mr.score_b is not null
        and (p.score_a - p.score_b) = (mr.score_a - mr.score_b)
    ) * 5

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

-- ── PASSO 4: Permissões ────────────────────────────────────────────────────────

alter view public.ranking_view owner to postgres;
grant select on public.ranking_view to anon, authenticated;

-- ── VERIFICAÇÃO (rode depois) ─────────────────────────────────────────────────
--
-- 1. Confirmar que os resultados estão gravados:
-- select espn_event_id, winner_team_id, score_a, score_b
-- from public.match_results
-- order by espn_event_id;
--
-- 2. Confirmar pontos no ranking:
-- select display_name, hits, exact_hits, points
-- from public.ranking_view
-- order by points desc;
-- ─────────────────────────────────────────────────────────────────────────────
