"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, Moon, Radio, Sun } from "lucide-react";
import { useApp, type Lang } from "@/lib/app-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { BrandLogo, BrandWordmark } from "@/components/brand/BrandLogo";
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

interface LangOption {
  code: Lang;
  countryCode: string;
  label: string;
}

const LANGS: LangOption[] = [
  { code: "ES", countryCode: "ve", label: "Español" },
  { code: "PT", countryCode: "br", label: "Português" },
  { code: "EN", countryCode: "us", label: "English" },
];

function FlagImage({ countryCode, size = 18 }: { countryCode: string; size?: number }) {
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

  const navItems = [
    { to: "/games", label: t("navGames") },
    { to: "/games/demo-live", label: t("navLive") },
  ];

  const currentLang = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  const avatarFallback = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "IK";

  async function handleLogout() {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Auth not configured locally: signing out still returns to /login.
    }
    router.push("/login");
  }

  return (
    <>
      <div className="h-16 sm:hidden" aria-hidden="true" />

      <header className="fixed top-0 z-40 w-full border-b border-white/10 bg-surface-1/90 backdrop-blur sm:sticky">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* Mobile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:hidden"
                aria-label={t("navGames")}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link
                    href={item.to}
                    className={cn(
                      "flex cursor-pointer items-center gap-2",
                      pathname === item.to && "bg-accent font-medium",
                    )}
                  >
                    <Radio className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t("language")}
              </DropdownMenuLabel>
              {LANGS.map((option) => (
                <DropdownMenuItem
                  key={option.code}
                  onClick={() => setLang(option.code)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2",
                    lang === option.code && "bg-accent",
                  )}
                >
                  <FlagImage countryCode={option.countryCode} size={16} />
                  <span className="text-sm">{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5" aria-label={t("appName")}>
            <BrandLogo size={36} priority />
            <span className="hidden sm:inline">
              <BrandWordmark />
            </span>
            <span className="sm:hidden">
              <BrandWordmark withLive={false} />
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            {navItems.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden h-8 gap-1.5 border-white/15 bg-white/5 px-2 sm:flex"
                  aria-label={t("language")}
                >
                  <FlagImage countryCode={currentLang.countryCode} size={16} />
                  <span className="text-xs font-medium">{lang}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {LANGS.map((option) => (
                  <DropdownMenuItem
                    key={option.code}
                    onClick={() => setLang(option.code)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2",
                      lang === option.code && "bg-accent",
                    )}
                  >
                    <FlagImage countryCode={option.countryCode} size={16} />
                    <span className="text-sm">{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={t("theme")}
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

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Avatar className="h-8 w-8 border border-white/15 sm:h-9 sm:w-9">
                      {user.avatarUrl && (
                        <AvatarImage src={user.avatarUrl} alt={user.name || "avatar"} />
                      )}
                      <AvatarFallback className="bg-brand-blue-strong text-xs text-white">
                        {avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{user.name || user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="h-8 font-semibold">
                <Link href="/login">{t("signIn")}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
