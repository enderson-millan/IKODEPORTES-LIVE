# Funcionalidade Ao Vivo — Guia Completo

Como funciona a página `/live` do MataMata.live: transmissões ao vivo dos jogos da Copa do Mundo 2026 via YouTube (CazéTV), com suporte a múltiplos jogos simultâneos.

---

## Visão Geral

```
Admin insere youtube_video_id + team_hint no Supabase (antes do jogo)
         ↓
pg_cron chama /api/sync-results a cada 5 minutos
         ↓
Jogo fica LIVE na ESPN → cron vincula match_id automaticamente
         ↓
useLiveStreams() busca os streams ativos
         ↓
/live exibe o embed do YouTube + card do jogo ao vivo
         ↓
AppHeader mostra badge pulsante • Ao Vivo
BracketMatchCard mostra botão ▶ Assistir
```

---

## Pré-requisito — Migração da tabela

Se você criou a tabela com o `live-streams-setup.sql` original, rode a migração abaixo
para tornar `match_id` nullable e adicionar a coluna `team_hint`:

```sql
-- Rodar no SQL Editor do Supabase
alter table public.live_streams
  alter column match_id drop not null;

alter table public.live_streams
  add column if not exists team_hint text;
```

> Se estiver criando a tabela do zero, use o `live-streams-setup.sql` atualizado —
> ele já inclui essas colunas.

---

## Fluxo automático — dia de jogo

### Passo 1 — Obter o YouTube Video ID com antecedência

O canal oficial é [@CazeTV](https://www.youtube.com/@CazeTV).

A CazéTV geralmente publica o stream com **algumas horas de antecedência** — o vídeo
fica como "aguardando" e já tem um ID fixo que você pode usar antes do jogo começar.

**Como encontrar o video ID:**

1. Acesse o canal da CazéTV no YouTube
2. Clique no stream do jogo (mesmo que ainda esteja "aguardando")
3. A URL será: `https://www.youtube.com/watch?v=XXXXXXXXXXX`
4. Copie apenas o `XXXXXXXXXXX` — esse é o video ID

---

### Passo 2 — Inserir no Supabase com `team_hint`

No **SQL Editor** do Supabase, insira o stream **sem o `match_id`**, usando `team_hint`
com a abreviação ESPN de um dos times do jogo:

```sql
-- Exemplo: Bélgica × Senegal
insert into public.live_streams (youtube_video_id, label, team_hint)
values ('SEU_VIDEO_ID_AQUI', 'CazéTV', 'BEL');
```

> O `team_hint` pode ser a abreviação de qualquer um dos dois times do jogo.
> O cron usa essa abreviação para identificar qual partida vincular.
> Exemplos: `'BRA'`, `'BEL'`, `'SEN'`, `'ENG'`, `'FRA'`

**Jogos simultâneos** — insira uma linha para cada jogo:

```sql
insert into public.live_streams (youtube_video_id, label, team_hint) values
  ('VIDEO_ID_JOGO_1', 'CazéTV', 'BRA'),
  ('VIDEO_ID_JOGO_2', 'CazéTV', 'FRA');
```

**Múltiplos canais para o mesmo jogo:**

```sql
insert into public.live_streams (youtube_video_id, label, team_hint) values
  ('VIDEO_ID_CAZE',  'CazéTV',    'BRA'),
  ('VIDEO_ID_GLOBO', 'Globo Play', 'BRA');
```

---

### Passo 3 — Aguardar o cron vincular automaticamente

Quando o jogo ficar **LIVE** na ESPN, o pg_cron (rodando a cada 5 min) vai:

1. Detectar o jogo como LIVE
2. Buscar registros em `live_streams` onde `match_id IS NULL` e `team_hint` bate com um dos times
3. Preencher o `match_id` automaticamente

A live aparece no app em até **5 minutos** após o apito inicial — sem você precisar
fazer mais nada.

---

### Passo 4 — Desativar o stream após o jogo

Após o jogo terminar, desative o stream para não exibir o replay como "ao vivo":

```sql
-- Desativar por team_hint (caso match_id ainda não tenha sido vinculado)
update public.live_streams
set is_active = false
where team_hint = 'BEL';

-- Ou desativar por match_id (após o vínculo automático)
update public.live_streams
set is_active = false
where match_id = '760493';

-- Ou desativar todos de uma vez
update public.live_streams
set is_active = false;
```

---

## Os 3 cenários de inserção

O cron **nunca toca em linhas onde `match_id` já está preenchido**. Isso permite
usar qualquer um dos três cenários abaixo sem conflito.

---

### Cenário 1 — Totalmente manual

Você sabe o `match_id` e já tem o vídeo. O cron ignora essa linha completamente.

```sql
insert into public.live_streams (match_id, youtube_video_id, label)
values ('760493', 'SEU_VIDEO_ID', 'CazéTV');
```

**Quando usar:** quando você consultou a tabela de referência ou a ESPN API e já
tem o ID do jogo em mãos.

---

### Cenário 2 — Semi-automático (recomendado)

Você tem o vídeo mas não quer buscar o `match_id`. Deixa o cron vincular.

```sql
insert into public.live_streams (youtube_video_id, label, team_hint)
values ('SEU_VIDEO_ID', 'CazéTV', 'BEL');
-- match_id = NULL → cron preenche automaticamente quando BEL ficar LIVE
```

**Quando usar:** no dia a dia — o mais prático. Só precisar do ID do vídeo e
a abreviação de um dos times.

---

### Cenário 3 — Controle total

Você preenche tudo. O `team_hint` fica só como referência — o cron ignora.

```sql
insert into public.live_streams (match_id, youtube_video_id, label, team_hint)
values ('760493', 'SEU_VIDEO_ID', 'CazéTV', 'BEL');
```

**Quando usar:** quando quer ter todos os dados registrados e não depender do
cron em hipótese alguma.

---

> **Resumo:** se `match_id` está preenchido → cron ignora. Se `match_id IS NULL`
> e `team_hint` bate com um time LIVE → cron vincula. Sem conflito em nenhum caso.

---

Para descobrir o `match_id` (ESPN event ID), veja a tabela de referência abaixo.

---

## Tabela de referência — IDs ESPN

### R32 (Oitavas — fase atual)

| ID ESPN | Jogo                      |
| ------- | ------------------------- |
| 760486  | Canadá × África do Sul    |
| 760487  | Japão × Brasil            |
| 760489  | Paraguai × Alemanha       |
| 760488  | Marrocos × Holanda        |
| 760490  | Noruega × Costa do Marfim |
| 760492  | Suécia × França           |
| 760491  | Equador × México          |
| 760495  | Congo DR × Inglaterra     |
| 760493  | Senegal × Bélgica         |
| 760494  | Bósnia × EUA              |
| 760497  | Áustria × Espanha         |
| 760496  | Croácia × Portugal        |
| 760498  | Argélia × Suíça           |
| 760499  | Egito × Austrália         |
| 760500  | Cabo Verde × Argentina    |
| 760501  | Gana × Colômbia           |

> Para as fases seguintes (R16, QF, SF, Final), os IDs vão de `760502` a `760517`.
> Consulte a ESPN API diretamente ou aguarde o cron detectar os jogos automaticamente.

---

## Como o app exibe a transmissão

### Página `/live`

- **Com jogo ao vivo:** exibe o embed YouTube em 16:9 + `MatchCard` do jogo ao lado
- **Com 2 jogos simultâneos:** empilha dois blocos (embed + card) verticalmente
- **Sem jogo ao vivo:** mostra mensagem e os próximos 4 jogos agendados
- Refetch automático a cada 60s para pegar novos streams inseridos

### AppHeader

- O link "Ao Vivo" aparece sempre na navegação
- Quando há jogo LIVE (via query `["matches"]`): mostra badge pulsante vermelho ●
- Quando não há jogo LIVE: mostra ícone 📡 discreto

### BracketMatchCard

- Quando um card está com status `LIVE`: aparece botão `▶ Assistir` na base
- Clique leva diretamente para `/live`

---

## Abreviações ESPN — referência rápida

| País       | Abreviação |
| ---------- | ---------- |
| Brasil     | BRA        |
| Argentina  | ARG        |
| França     | FRA        |
| Inglaterra | ENG        |
| Alemanha   | GER        |
| Espanha    | ESP        |
| Portugal   | POR        |
| Bélgica    | BEL        |
| Holanda    | NED        |
| Croácia    | CRO        |
| EUA        | USA        |
| México     | MEX        |
| Senegal    | SEN        |
| Congo DR   | COD        |
| Japão      | JPN        |
| Marrocos   | MAR        |
| Suíça      | SUI        |
| Austrália  | AUS        |

> Em caso de dúvida sobre a abreviação, consulte a ESPN API — o campo é
> `competitions[0].competitors[].team.abbreviation`.

---

## Troubleshooting

**O cron não vinculou o match_id:**

- Verifique se o `team_hint` está correto (mesma abreviação da ESPN, ex: `'BEL'` não `'BEL.'`)
- Verifique se `is_active = true` e `match_id IS NULL` no registro
- O jogo pode ainda não estar LIVE na ESPN — aguarde alguns minutos após o apito
- Consulte os logs da rota em Vercel → seu projeto → Deployments → Functions → `/api/sync-results`

**O embed não aparece:**

- Verifique se o `youtube_video_id` está correto (só o ID, sem a URL completa)
- Verifique se `is_active = true` na tabela
- Verifique se o `match_id` foi vinculado (`select match_id from public.live_streams`)

**O stream aparece mas o vídeo diz "reprodução não disponível":**

- Alguns streams da CazéTV bloqueiam embed externo — não é controlável pelo app
- Alternativa: mostrar o link direto com `target="_blank"` em vez do iframe

**A página `/live` mostra "Nenhum jogo ao vivo":**

- O status do jogo vem da ESPN (`match.status === "LIVE"`) — não do Supabase
- A ESPN leva alguns minutos para atualizar o status para LIVE após o apito inicial

**Jogos simultâneos aparecem fora de ordem:**

- A ordem de exibição segue `created_at` da tabela `live_streams`
- Insira o stream do jogo que começar primeiro primeiro
