"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { BrandLogo, BrandWordmark } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

const AUTH_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function LoginPage() {
  const { t } = useApp();

  async function handleGoogleLogin() {
    if (!AUTH_CONFIGURED) return;
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="bg-stadium relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(37,99,235,0.18),transparent_55%)]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-surface-2/80 p-8 text-center shadow-2xl backdrop-blur">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo size={84} priority className="ring-gold" />
          <BrandWordmark withLive={false} className="text-xl" />
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand-gold">
            {t("tagline")}
          </p>
        </div>

        <div className="mt-8 space-y-2">
          <h1 className="text-xl font-bold tracking-tight">{t("loginTitle")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("loginSubtitle")}</p>
        </div>

        <div className="mt-7 flex flex-col gap-3">
          <Button
            type="button"
            size="lg"
            onClick={handleGoogleLogin}
            disabled={!AUTH_CONFIGURED}
            className="h-12 w-full gap-3 bg-white text-base font-semibold text-black hover:bg-white/90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            {t("signInGoogle")}
          </Button>

          {!AUTH_CONFIGURED && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5" />
              {t("loginUnavailable")}
            </p>
          )}

          <Button asChild variant="ghost" size="lg" className="h-11 w-full gap-2">
            <Link href="/games">
              {t("spectatorMode")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} {BRAND.name}
        </p>
      </div>
    </div>
  );
}
