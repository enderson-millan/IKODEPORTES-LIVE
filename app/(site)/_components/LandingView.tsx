"use client";

import Link from "next/link";
import { ArrowRight, Languages, Radio, ShieldCheck, Tv2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { BrandLogo, BrandWordmark } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { DEMO_GAME_ID, demoGame } from "@shared/fixtures/demo-game";

function MiniScoreboard() {
  const { t } = useApp();
  const { matchup, score, clock, count } = demoGame;

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-2/80 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="flex items-center gap-1.5 text-live-ink">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
          </span>
          {t("statusLive")}
        </span>
        <span>
          {t("inning")} {clock.inning} · {clock.half === "TOP" ? t("topHalf") : t("bottomHalf")}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-black"
            style={{ backgroundColor: matchup.away.primaryColor, color: "#070D1A" }}
          >
            {matchup.away.code}
          </span>
          <span className="font-display text-sm font-bold uppercase leading-tight">
            {matchup.away.shortName ?? matchup.away.name}
          </span>
        </div>

        <div className="font-display text-4xl font-black tabular-nums text-brand-gold-ink">
          {score.away}
          <span className="mx-1 text-muted-foreground">-</span>
          {score.home}
        </div>

        <div className="flex items-center justify-end gap-2 text-right">
          <span className="font-display text-sm font-bold uppercase leading-tight">
            {matchup.home.shortName ?? matchup.home.name}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-black text-white"
            style={{ backgroundColor: matchup.home.primaryColor }}
          >
            {matchup.home.code}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 font-display text-xs font-bold uppercase tracking-widest">
        <span className="rounded bg-white/5 px-2 py-1">
          B <span className="text-brand-gold-ink tabular-nums">{count.balls}</span>
        </span>
        <span className="rounded bg-white/5 px-2 py-1">
          S <span className="text-brand-gold-ink tabular-nums">{count.strikes}</span>
        </span>
        <span className="rounded bg-white/5 px-2 py-1">
          O <span className="text-brand-gold-ink tabular-nums">{count.outs}</span>
        </span>
      </div>
    </div>
  );
}

export function LandingView() {
  const { t } = useApp();

  const features = [
    { icon: ShieldCheck, title: t("featureLiveTitle"), desc: t("featureLiveDesc") },
    { icon: Tv2, title: t("featureOverlayTitle"), desc: t("featureOverlayDesc") },
    { icon: Radio, title: t("featureAgnosticTitle"), desc: t("featureAgnosticDesc") },
    { icon: Languages, title: t("featureI18nTitle"), desc: t("featureI18nDesc") },
  ];

  return (
    <div className="bg-stadium min-h-[calc(100vh-4rem)]">
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold-ink">
            <Radio className="h-3.5 w-3.5" />
            {t("heroEyebrow")}
          </span>

          <div className="mt-6 flex items-center gap-3">
            <BrandLogo size={64} priority className="ring-gold" />
            <div>
              <BrandWordmark className="text-2xl" />
              <p className="font-display text-xs font-semibold uppercase tracking-[0.32em] text-brand-gold-ink">
                {t("tagline")}
              </p>
            </div>
          </div>

          <h1 className="mt-8 max-w-2xl font-display text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-5xl">
            {t("heroTitle")}
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t("heroSubtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 gap-2 px-6 text-base font-bold">
              <Link href={`/games/${DEMO_GAME_ID}`}>
                {t("ctaDemo")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link href="/games">{t("ctaGames")}</Link>
            </Button>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-6 rounded-3xl bg-[radial-gradient(circle_at_50%_30%,rgba(250,204,21,0.16),transparent_65%)] blur-xl" />
            <MiniScoreboard />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-surface-1/60">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <article
              key={title}
              className="rounded-xl border border-white/10 bg-surface-2/60 p-5 transition-colors hover:border-brand-gold/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue-strong/20 text-brand-gold-ink">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold uppercase tracking-wide">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <div className="rounded-xl border border-brand-gold/25 bg-brand-gold/5 p-5">
            <h2 className="font-display text-base font-bold uppercase tracking-widest text-brand-gold-ink">
              {t("phaseTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("phaseDesc")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
