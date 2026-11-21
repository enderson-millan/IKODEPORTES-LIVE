"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";

export type Lang = "PT" | "ES" | "EN";

type Dict = Record<string, Record<Lang, string>>;

export const dict: Dict = {
  appName: { PT: "MataMata.live", ES: "MataMata.live", EN: "MataMata.live" },
  tagline: {
    PT: "Acompanhe os resultados em tempo real e faça seus palpites do mata-mata.",
    ES: "Sigue los resultados en vivo y haz tus pronósticos del mata-mata.",
    EN: "Follow live results and make your knockout-stage predictions.",
  },
  signInGoogle: { PT: "Entrar com o Google", ES: "Entrar con Google", EN: "Sign in with Google" },
  bracket: { PT: "Chaveamento", ES: "Llaves", EN: "Bracket" },
  ranking: { PT: "Ranking", ES: "Clasificación", EN: "Leaderboard" },
  logout: { PT: "Sair", ES: "Salir", EN: "Log out" },
  live: { PT: "AO VIVO", ES: "EN VIVO", EN: "LIVE" },
  liveMatch: { PT: "Jogo ao vivo", ES: "Partido en vivo", EN: "Live match" },
  bracketSubtitle: {
    PT: "Copa do Mundo FIFA 2026",
    ES: "Copa Mundial FIFA 2026",
    EN: "FIFA World Cup 2026",
  },
  upcoming: { PT: "EM BREVE", ES: "PRÓXIMO", EN: "UPCOMING" },
  finished: { PT: "ENCERRADO", ES: "FINALIZADO", EN: "FINISHED" },
  r32: { PT: "R. de 32", ES: "Ronda de 32", EN: "Round of 32" },
  r16: { PT: "Oitavas", ES: "Octavos", EN: "Round of 16" },
  qf: { PT: "Quartas", ES: "Cuartos", EN: "Quarter-finals" },
  sf: { PT: "Semifinais", ES: "Semifinales", EN: "Semi-finals" },
  third: { PT: "3º Lugar", ES: "3er Lugar", EN: "Third Place" },
  final: { PT: "Final", ES: "Final", EN: "Final" },
  pickHint: {
    PT: "Clique no time que avança",
    ES: "Elige el equipo que avanza",
    EN: "Pick who advances",
  },
  position: { PT: "Posição", ES: "Posición", EN: "Position" },
  user: { PT: "Usuário", ES: "Usuario", EN: "User" },
  points: { PT: "Pontos", ES: "Puntos", EN: "Points" },
  accuracy: { PT: "Acertos", ES: "Aciertos", EN: "Hits" },
  trend: { PT: "Tendência", ES: "Tendencia", EN: "Trend" },
  yourPosition: { PT: "Sua posição", ES: "Tu posición", EN: "Your position" },
  yourPositionLabel: { PT: "SUA POSIÇÃO", ES: "TU POSICIÓN", EN: "YOUR POSITION" },
  rankingSubtitle: {
    PT: "Top palpiteiros do mata-mata",
    ES: "Top pronosticadores del mata-mata",
    EN: "Top knockout stage pickers",
  },
  welcome: { PT: "Bem-vindo de volta", ES: "Bienvenido de nuevo", EN: "Welcome back" },
  watchLive: { PT: "▶ Assistir", ES: "▶ Ver en vivo", EN: "▶ Watch Live" },
  livePageTitle: { PT: "Ao Vivo", ES: "En Vivo", EN: "Live" },
  livePageSubtitle: {
    PT: "Transmissão ao vivo dos jogos da Copa do Mundo 2026",
    ES: "Transmisión en vivo de los partidos de la Copa del Mundo 2026",
    EN: "Live broadcast of FIFA World Cup 2026 matches",
  },
  noLiveMatches: {
    PT: "Nenhum jogo ao vivo no momento",
    ES: "Ningún partido en vivo en este momento",
    EN: "No live matches right now",
  },
  nextMatches: { PT: "Próximos jogos", ES: "Próximos partidos", EN: "Upcoming matches" },
  noStreamAvailable: {
    PT: "Transmissão não disponível para este jogo",
    ES: "Transmisión no disponible para este partido",
    EN: "Stream not available for this match",
  },
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
  theme: "light" | "dark";
  toggleTheme: () => void;
  t: (k: keyof typeof dict) => string;
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
  // picks e setPick REMOVIDOS → TanStack Query + Supabase
}

const AppCtx = createContext<AppContextType | null>(null);

function AppProviderInner({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("PT");
  const [user, setUser] = useState<AppUser | null>(null);
  const { resolvedTheme, setTheme } = useTheme();

  // Rehydrate lang from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("lang") as Lang | null;
    if (stored && ["PT", "ES", "EN"].includes(stored)) {
      setLangState(stored);
    }
  }, []);

  // Persist lang to localStorage whenever it changes
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lang", l);
    }
  };

  const theme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <AppCtx.Provider
      value={{
        lang,
        setLang,
        theme,
        toggleTheme,
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
