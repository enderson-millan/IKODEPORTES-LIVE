"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "PT" | "ES" | "EN";

type Dict = Record<string, Record<Lang, string>>;

const LANG_STORAGE_KEY = "ikodeportes.lang";
const LANGS: Lang[] = ["ES", "PT", "EN"];
const DEFAULT_LANG: Lang = "ES";

export const dict: Dict = {
  // ── Brand & shell ─────────────────────────────────────────────────────────
  appName: { ES: "IKODEPORTES Live", PT: "IKODEPORTES Live", EN: "IKODEPORTES Live" },
  tagline: {
    ES: "EL DEPORTE, EN CONTEXTO.",
    PT: "EL DEPORTE, EN CONTEXTO.",
    EN: "EL DEPORTE, EN CONTEXTO.",
  },
  navGames: { ES: "Partidos", PT: "Jogos", EN: "Games" },
  navLive: { ES: "En vivo", PT: "Ao vivo", EN: "Live" },
  ticker: { ES: "Jornada", PT: "Rodada", EN: "Slate" },
  timezoneAbbr: { ES: "VET", PT: "VET", EN: "VET" },
  copyright: { ES: "Copyright", PT: "Copyright", EN: "Copyright" },
  sourceUpdated: { ES: "Fuente", PT: "Fonte", EN: "Source" },
  ago: { ES: "hace", PT: "há", EN: "ago" },
  noConnection: { ES: "Sin conexión", PT: "Sem conexão", EN: "Offline" },
  reconnecting: { ES: "Reconectando", PT: "Reconectando", EN: "Reconnecting" },
  staleFeed: { ES: "Datos atrasados", PT: "Dados atrasados", EN: "Stale data" },
  staleFeedHint: {
    ES: "El proveedor no publicó cambios en el último minuto y medio.",
    PT: "O provedor não publicou mudanças no último minuto e meio.",
    EN: "The provider has not published changes for 90 seconds.",
  },
  madeWith: { ES: "Hecho con", PT: "Feito com", EN: "Made with" },
  madeBy: { ES: "por", PT: "por", EN: "by" },
  honorific: { ES: "Ing.", PT: "Eng.", EN: "Eng." },
  signIn: { ES: "Entrar", PT: "Entrar", EN: "Sign in" },
  signInGoogle: {
    ES: "Continuar con Google",
    PT: "Continuar com o Google",
    EN: "Continue with Google",
  },
  signOut: { ES: "Salir", PT: "Sair", EN: "Log out" },
  spectatorMode: {
    ES: "Continuar como espectador",
    PT: "Continuar como espectador",
    EN: "Continue as spectator",
  },
  language: { ES: "Idioma", PT: "Idioma", EN: "Language" },

  // ── Landing ───────────────────────────────────────────────────────────────
  heroEyebrow: {
    ES: "Game tracker · Béisbol y softbol",
    PT: "Game tracker · Beisebol e softbol",
    EN: "Game tracker · Baseball and softball",
  },
  heroTitle: {
    ES: "Seguimiento en vivo, jugada por jugada.",
    PT: "Acompanhamento ao vivo, jogada por jogada.",
    EN: "Live tracking, play by play.",
  },
  heroSubtitle: {
    ES: "Motor de play-by-play agnóstico de disciplinas y ligas. Alimenta la web y el overlay de OBS desde un único estado canónico.",
    PT: "Motor de play-by-play agnóstico de disciplinas e ligas. Alimenta a web e o overlay do OBS a partir de um único estado canônico.",
    EN: "A play-by-play engine agnostic to disciplines and leagues. It feeds the web app and the OBS overlay from a single canonical state.",
  },
  ctaDemo: { ES: "Ver partido demo", PT: "Ver jogo demo", EN: "View demo game" },
  ctaGames: { ES: "Todos los partidos", PT: "Todos os jogos", EN: "All games" },
  featureLiveTitle: { ES: "Estado canónico", PT: "Estado canônico", EN: "Canonical state" },
  featureLiveDesc: {
    ES: "Un contrato tipado para marcador, bases, cuenta, pizarra y relato. Sin lógica de fútbol heredada.",
    PT: "Um contrato tipado para placar, bases, contagem, pizarra e relato. Sem lógica de futebol herdada.",
    EN: "One typed contract for score, bases, count, line score and play-by-play. No inherited football logic.",
  },
  featureOverlayTitle: { ES: "Listo para OBS", PT: "Pronto para OBS", EN: "OBS ready" },
  featureOverlayDesc: {
    ES: "Paneles independientes y números tabulares para un canvas transparente de 1920x1080.",
    PT: "Painéis independentes e números tabulares para um canvas transparente de 1920x1080.",
    EN: "Independent panels and tabular numerals for a transparent 1920x1080 canvas.",
  },
  featureAgnosticTitle: { ES: "Multi-liga", PT: "Multi-liga", EN: "Multi-league" },
  featureAgnosticDesc: {
    ES: "LVBP, MLB, LIDOM, LMP, WBC, softbol o una liga propia vía feed genérico.",
    PT: "LVBP, MLB, LIDOM, LMP, WBC, softbol ou uma liga própria via feed genérico.",
    EN: "LVBP, MLB, LIDOM, LMP, WBC, softball or your own league through a generic feed.",
  },
  featureI18nTitle: { ES: "Trilingüe", PT: "Trilíngue", EN: "Trilingual" },
  featureI18nDesc: {
    ES: "Interfaz en español, portugués e inglés con el español como idioma predeterminado.",
    PT: "Interface em espanhol, português e inglês com o espanhol como idioma padrão.",
    EN: "Interface in Spanish, Portuguese and English, with Spanish as the default.",
  },

  featureTrackerTitle: {
    ES: "Tracker manual",
    PT: "Tracker manual",
    EN: "Manual tracker",
  },
  featureTrackerDesc: {
    ES: "El operador registra cada jugada y el overlay responde al instante, sin depender de la latencia del proveedor.",
    PT: "O operador registra cada jogada e o overlay responde na hora, sem depender da latência do provedor.",
    EN: "The operator records each play and the overlay answers instantly, without depending on provider latency.",
  },
  comingSoon: { ES: "Próximamente", PT: "Em breve", EN: "Coming soon" },

  // ── Games list ────────────────────────────────────────────────────────────
  gamesTitle: { ES: "Partidos", PT: "Jogos", EN: "Games" },
  gamesSubtitle: {
    ES: "Centro de datos en vivo. Abre un partido para ver el detalle del contrato canónico.",
    PT: "Centro de dados ao vivo. Abra um jogo para ver o detalhe do contrato canônico.",
    EN: "Live data center. Open a game to inspect the canonical contract.",
  },
  noGames: {
    ES: "No hay partidos disponibles",
    PT: "Nenhum jogo disponível",
    EN: "No games available",
  },
  apiOffline: {
    ES: "API local sin conexión. Mostrando el partido demo.",
    PT: "API local sem conexão. Mostrando o jogo demo.",
    EN: "Local API offline. Showing the demo game.",
  },
  openGame: { ES: "Abrir tracker", PT: "Abrir tracker", EN: "Open tracker" },
  demoBadge: { ES: "Demo", PT: "Demo", EN: "Demo" },
  leagueLabel: { ES: "Liga", PT: "Liga", EN: "League" },

  // ── Game statuses ─────────────────────────────────────────────────────────
  statusLive: { ES: "EN VIVO", PT: "AO VIVO", EN: "LIVE" },
  statusScheduled: { ES: "PROGRAMADO", PT: "PROGRAMADO", EN: "SCHEDULED" },
  statusFinal: { ES: "FINALIZADO", PT: "ENCERRADO", EN: "FINAL" },
  statusPostponed: { ES: "APLAZADO", PT: "ADIADO", EN: "POSTPONED" },
  statusCanceled: { ES: "CANCELADO", PT: "CANCELADO", EN: "CANCELED" },

  // ── Game detail ───────────────────────────────────────────────────────────
  backToGames: { ES: "Volver a partidos", PT: "Voltar aos jogos", EN: "Back to games" },
  lineScore: { ES: "Pizarra por entradas", PT: "Pizarra por entradas", EN: "Line score" },
  total: { ES: "Total", PT: "Total", EN: "Total" },
  runs: { ES: "C", PT: "C", EN: "R" },
  hits: { ES: "H", PT: "H", EN: "H" },
  errors: { ES: "E", PT: "E", EN: "E" },
  inning: { ES: "Entrada", PT: "Entrada", EN: "Inning" },
  topHalf: { ES: "Alta", PT: "Alta", EN: "Top" },
  bottomHalf: { ES: "Baja", PT: "Baixa", EN: "Bottom" },
  count: { ES: "Cuenta del turno", PT: "Contagem da vez", EN: "Count" },
  balls: { ES: "Bolas", PT: "Bolas", EN: "Balls" },
  strikes: { ES: "Strikes", PT: "Strikes", EN: "Strikes" },
  outs: { ES: "Outs", PT: "Outs", EN: "Outs" },
  bases: { ES: "En base", PT: "Em base", EN: "On base" },
  basesEmpty: { ES: "Bases limpias", PT: "Bases limpas", EN: "Bases empty" },
  atBat: { ES: "Duelo en vivo", PT: "Duelo ao vivo", EN: "Live duel" },
  batter: { ES: "Al bate", PT: "Ao bastão", EN: "At bat" },
  pitcher: { ES: "Lanzador", PT: "Arremessador", EN: "Pitcher" },
  average: { ES: "AVG", PT: "AVG", EN: "AVG" },
  homeRuns: { ES: "HR", PT: "HR", EN: "HR" },
  rbi: { ES: "CI", PT: "RBI", EN: "RBI" },
  era: { ES: "ERA", PT: "ERA", EN: "ERA" },
  pitchesOfAtBat: {
    ES: "Lanzamientos del turno",
    PT: "Arremessos da vez",
    EN: "Pitches this at-bat",
  },
  pitch: { ES: "Lanzamiento", PT: "Arremesso", EN: "Pitch" },
  onDeck: { ES: "En espera al bate (On-Deck)", PT: "Na espera ao bastão (On-Deck)", EN: "On deck" },
  defense: { ES: "Cuadro defensivo", PT: "Quadro defensivo", EN: "Defense" },
  playByPlay: { ES: "Relato en vivo", PT: "Relato ao vivo", EN: "Play by play" },
  venue: { ES: "Estadio", PT: "Estádio", EN: "Venue" },
  date: { ES: "Fecha", PT: "Data", EN: "Date" },
  field: { ES: "Campo", PT: "Campo", EN: "Field" },
  lastPlay: { ES: "Última jugada", PT: "Última jogada", EN: "Last play" },
  connecting: { ES: "Conectando", PT: "Conectando", EN: "Connecting" },
  offline: { ES: "Sin conexión", PT: "Sem conexão", EN: "Offline" },
  gameNotFound: { ES: "Partido no encontrado", PT: "Jogo não encontrado", EN: "Game not found" },
  lastUpdated: { ES: "Actualizado", PT: "Atualizado", EN: "Updated" },

  // ── Login ─────────────────────────────────────────────────────────────────
  loginTitle: {
    ES: "Bienvenido a IKODEPORTES Live",
    PT: "Bem-vindo ao IKODEPORTES Live",
    EN: "Welcome to IKODEPORTES Live",
  },
  loginSubtitle: {
    ES: "Inicia sesión para administrar marcadores y paneles del overlay. Los espectadores pueden entrar sin cuenta.",
    PT: "Entre para administrar placares e painéis do overlay. Espectadores podem entrar sem conta.",
    EN: "Sign in to manage scores and overlay panels. Spectators can continue without an account.",
  },
  loginUnavailable: {
    ES: "La autenticación no está configurada en este entorno.",
    PT: "A autenticação não está configurada neste ambiente.",
    EN: "Authentication is not configured in this environment.",
  },
  backHome: { ES: "Volver al inicio", PT: "Voltar ao início", EN: "Back home" },
};

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: keyof typeof dict) => string;
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
}

const AppCtx = createContext<AppContextType | null>(null);

function AppProviderInner({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [user, setUser] = useState<AppUser | null>(null);

  // Rehydrate lang from localStorage (Spanish stays the default).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY) as Lang | null;
    if (stored && LANGS.includes(stored)) {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANG_STORAGE_KEY, l);
    }
  };

  return (
    <AppCtx.Provider
      value={{
        lang,
        setLang,
        t: (k) => dict[k]?.[lang] ?? String(k),
        user,
        setUser,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return <AppProviderInner>{children}</AppProviderInner>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp outside AppProvider");
  return ctx;
}
