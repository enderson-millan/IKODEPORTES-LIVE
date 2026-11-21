-- ─── Fix: avatar_url no ranking_view ────────────────────────────────────────
--
-- O problema: a ranking_view faz JOIN em auth.users para buscar avatar_url,
-- mas o schema auth não é acessível via anon key por padrão no Supabase.
-- A view retorna avatar_url como null para todos os usuários.
--
-- Solução: usar SECURITY DEFINER na view para que ela execute com as
-- permissões do owner (postgres), contornando a restrição de acesso ao
-- schema auth.
--
-- Execute este SQL no Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → Cole e execute

-- 1. Recriar a ranking_view com SECURITY DEFINER
create or replace view public.ranking_view
  with (security_invoker = false)
as
select
  p.user_id,
  u.raw_user_meta_data ->> 'full_name'  as display_name,
  u.raw_user_meta_data ->> 'avatar_url' as avatar_url,
  count(*) filter (
    where mr.winner_team_id is not null
      and p.team_id = mr.winner_team_id
  )::int as hits,
  (count(*) filter (
    where mr.winner_team_id is not null
      and p.team_id = mr.winner_team_id
  ) * 10)::int as points
from public.picks p
join auth.users u on u.id = p.user_id
left join public.match_results mr on mr.espn_event_id = p.espn_event_id
group by p.user_id, display_name, avatar_url
order by points desc, hits desc;

-- 2. Garantir que o owner da view é o role postgres (necessário para SECURITY DEFINER)
alter view public.ranking_view owner to postgres;

-- 3. Garantir que anon e authenticated podem ler a view
grant select on public.ranking_view to anon, authenticated;
