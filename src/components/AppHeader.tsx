"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Moon,
  Sun,
  LogOut,
  Trophy,
  Radio,
  ChevronDown,
  Menu,
  LayoutGrid,
  BarChart2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useApp, type Lang } from "@/lib/app-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";

interface LangOption {
  code: Lang;
  countryCode: string;
  label: string;
}

const langs: LangOption[] = [
  { code: "PT", countryCode: "br", label: "Português" },
  { code: "ES", countryCode: "es", label: "Español" },
  { code: "EN", countryCode: "us", label: "English" },
];

function FlagImage({ countryCode, size = 20 }: { countryCode: string; size?: number }) {
  return (
    <Image
      src={`https://flagcdn.com/${countryCode}.svg`}
      alt={countryCode.toUpperCase()}
      width={size}
      height={Math.round(size * 0.75)}
      className="rounded-sm object-cover shadow-sm"
      unoptimized
    />
  );
}

export function AppHeader() {
  const { theme, toggleTheme, lang, setLang, t, user } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["matches"],
    queryFn: (): Promise<Match[]> =>
      fetch("/api/matches")
        .then((r) => r.json())
        .then((d: { matches?: Match[] }) => d.matches ?? []),
    staleTime: 30_000,
  });
  const hasLive = matches.some((m) => m.status === "LIVE");

  const navItems = [
    { to: "/bracket", label: t("bracket"), icon: LayoutGrid },
    { to: "/ranking", label: t("ranking"), icon: BarChart2 },
  ] as const;

  const currentLang = langs.find((l) => l.code === lang) ?? langs[0];

  const avatarFallback = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "EU";

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Spacer — compensates for fixed header on mobile; hidden on sm+ where header is sticky */}
      <div className="h-16 sm:hidden" aria-hidden="true" />

      <header className="fixed top-0 z-40 w-full border-b bg-background/80 backdrop-blur sm:sticky">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* ── Mobile hamburger — far left, hidden on desktop ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:hidden"
                aria-label="Menu de navegação"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {navItems.map((n) => {
                const Icon = n.icon;
                return (
                  <DropdownMenuItem key={n.to} asChild>
                    <Link
                      href={n.to}
                      className={cn(
                        "flex cursor-pointer items-center gap-2",
                        pathname === n.to && "bg-accent font-medium",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {n.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuItem asChild>
                <Link
                  href="/live"
                  className={cn(
                    "flex cursor-pointer items-center gap-2",
                    pathname === "/live" && "bg-red-500/15 font-medium text-red-500",
                    hasLive && pathname !== "/live" && "text-red-500",
                  )}
                >
                  {hasLive ? (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                  ) : (
                    <Radio className="h-4 w-4" />
                  )}
                  {t("livePageTitle")}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Idioma
              </DropdownMenuLabel>
              {langs.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2",
                    lang === l.code && "bg-accent font-medium",
                  )}
                >
                  <FlagImage countryCode={l.countryCode} size={16} />
                  <span className="text-sm">{l.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ── Logo ── */}
          <Link href="/bracket" className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">MataMata.live</span>
          </Link>

          {/* ── Desktop nav — hidden on mobile ── */}
          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            {navItems.map((n) => (
              <Link
                key={n.to}
                href={n.to}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === n.to
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                {n.label}
              </Link>
            ))}

            <Link
              href="/live"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === "/live"
                  ? "bg-red-500/15 text-red-500"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                hasLive && pathname !== "/live" && "text-red-500",
              )}
            >
              {hasLive ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
              ) : (
                <Radio className="h-3.5 w-3.5" />
              )}
              {t("livePageTitle")}
            </Link>
          </nav>

          {/* ── Right side actions ── */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {/* Language selector — desktop only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden h-8 gap-1.5 px-2 sm:flex"
                  aria-label="Selecionar idioma"
                >
                  <FlagImage countryCode={currentLang.countryCode} size={18} />
                  <span className="text-xs font-medium">{lang}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {langs.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2",
                      lang === l.code && "bg-accent font-medium",
                    )}
                  >
                    <FlagImage countryCode={l.countryCode} size={18} />
                    <span className="text-sm">{l.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="h-8 w-8"
            >
              {mounted ? (
                theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )
              ) : (
                <span className="h-4 w-4" />
              )}
            </Button>

            {/* User avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar className="h-8 w-8 border sm:h-9 sm:w-9">
                    {user?.avatarUrl && (
                      <AvatarImage src={user.avatarUrl} alt={user.name ?? "avatar"} />
                    )}
                    <AvatarFallback className="bg-linear-to-br from-emerald-500 to-sky-500 text-xs text-white">
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{user?.name ?? "Você"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}
