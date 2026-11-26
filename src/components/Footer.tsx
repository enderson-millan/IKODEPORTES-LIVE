"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useApp } from "@/lib/app-context";
import { BRAND } from "@/lib/brand";

export function Footer() {
  const { t } = useApp();
  const linkClass =
    "font-semibold text-primary underline underline-offset-2 transition-colors hover:text-primary/80";

  return (
    <footer className="border-t border-white/10 bg-surface-1/80" role="contentinfo">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <BrandLogo size={22} />
          <span className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
            {BRAND.name}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold uppercase tracking-widest text-brand-gold-ink">
            {BRAND.slogan}
          </span>
        </div>

        {/* The year comes from the clock, so the server and client can disagree
            for a moment at midnight; suppress that one-level warning. */}
        <p className="text-center sm:text-right" suppressHydrationWarning>
          © {new Date().getFullYear()} {t("copyright")}
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> &nbsp;·&nbsp; </span>
          {t("madeWith")}{" "}
          <Heart className="inline h-3 w-3 fill-red-400 text-red-400" aria-hidden="true" />{" "}
          {t("madeBy")}{" "}
          <Link
            href="https://endersonmillan.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {t("honorific")}
          </Link>{" "}
          <Link
            href="https://github.com/enderson-millan"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Enderson
          </Link>{" "}
          <Link
            href="https://www.linkedin.com/in/enderson-millan"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Millán
          </Link>
        </p>
      </div>
    </footer>
  );
}
