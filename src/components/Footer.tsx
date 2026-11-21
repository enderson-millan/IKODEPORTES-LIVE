import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface-1/80">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <BrandLogo size={22} />
          <span className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
            {BRAND.name}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold uppercase tracking-widest text-brand-gold">
            {BRAND.slogan}
          </span>
        </div>

        <p className="flex flex-wrap items-center justify-center gap-1">
          <span>© {new Date().getFullYear()}</span>
          <span aria-hidden="true">·</span>
          <span>Hecho por</span>
          <Link
            href="https://endersonmillan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground underline decoration-brand-gold/50 underline-offset-4 transition-colors hover:text-brand-gold"
          >
            Eng. Enderson Millán
          </Link>
        </p>
      </div>
    </footer>
  );
}
