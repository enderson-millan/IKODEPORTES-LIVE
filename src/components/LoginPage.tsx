"use client";

import Image from "next/image";
import { useApp } from "@/lib/app-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import stadiumBg from "@/assets/stadium-bg.jpg";
import trophy from "@/assets/trophy.png";
import mascot from "@/assets/mascot.png";

// All 48 qualified nations — split into two rows of 24
const ALL_NATIONS: { abbr: string; name: string }[] = [
  { abbr: "usa", name: "USA" },
  { abbr: "mex", name: "Mexico" },
  { abbr: "can", name: "Canada" },
  { abbr: "pan", name: "Panama" },
  { abbr: "hon", name: "Honduras" },
  { abbr: "crc", name: "Costa Rica" },
  { abbr: "bra", name: "Brazil" },
  { abbr: "arg", name: "Argentina" },
  { abbr: "col", name: "Colombia" },
  { abbr: "uru", name: "Uruguay" },
  { abbr: "ecu", name: "Ecuador" },
  { abbr: "chi", name: "Chile" },
  { abbr: "esp", name: "Spain" },
  { abbr: "fra", name: "France" },
  { abbr: "eng", name: "England" },
  { abbr: "ger", name: "Germany" },
  { abbr: "por", name: "Portugal" },
  { abbr: "ned", name: "Netherlands" },
  { abbr: "bel", name: "Belgium" },
  { abbr: "cro", name: "Croatia" },
  { abbr: "sui", name: "Switzerland" },
  { abbr: "nor", name: "Norway" },
  { abbr: "sco", name: "Scotland" },
  { abbr: "aut", name: "Austria" },
  { abbr: "cze", name: "Czech Republic" },
  { abbr: "bih", name: "Bosnia-Herzegovina" },
  { abbr: "swe", name: "Sweden" },
  { abbr: "tur", name: "Turkey" },
  { abbr: "mar", name: "Morocco" },
  { abbr: "egy", name: "Egypt" },
  { abbr: "alg", name: "Algeria" },
  { abbr: "gha", name: "Ghana" },
  { abbr: "civ", name: "Ivory Coast" },
  { abbr: "tun", name: "Tunisia" },
  { abbr: "sen", name: "Senegal" },
  { abbr: "rsa", name: "South Africa" },
  { abbr: "cod", name: "DR Congo" },
  { abbr: "cpv", name: "Cape Verde" },
  { abbr: "jpn", name: "Japan" },
  { abbr: "kor", name: "South Korea" },
  { abbr: "aus", name: "Australia" },
  { abbr: "irn", name: "Iran" },
  { abbr: "ksa", name: "Saudi Arabia" },
  { abbr: "qat", name: "Qatar" },
  { abbr: "irq", name: "Iraq" },
  { abbr: "jor", name: "Jordan" },
  { abbr: "nzl", name: "New Zealand" },
  { abbr: "uzb", name: "Uzbekistan" },
];

// Split 48 nations into two rows of 24
const ROW_TOP = ALL_NATIONS.slice(0, 24);
const ROW_BOTTOM = ALL_NATIONS.slice(24);

const FLAG_SIZE = 44; // px — visible and identifiable on all screens

interface FlagStripProps {
  nations: { abbr: string; name: string }[];
  direction: "left" | "right";
}

/**
 * Infinite-scroll flag strip.
 * Technique: render the array twice side-by-side ([...arr, ...arr]).
 * Animate translateX from 0 → -50% (left) or -50% → 0 (right).
 * When the animation completes one cycle, the position is visually identical
 * to the start — creating a seamless loop with pure CSS.
 */
function FlagStrip({ nations, direction }: FlagStripProps) {
  // Duplicate for seamless loop
  const doubled = [...nations, ...nations];

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        // Fade edges so flags enter/exit gracefully
        maskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <div
        className={direction === "left" ? "ticker-left" : "ticker-right"}
        style={{ display: "flex", gap: "12px", width: "max-content" }}
      >
        {doubled.map(({ abbr, name }, i) => (
          <div
            key={`${abbr}-${i}`}
            className="shrink-0 overflow-hidden rounded-full shadow-lg ring-2 ring-white/50 transition-all duration-200 hover:scale-110 hover:ring-white hover:shadow-white/30"
            style={{ width: FLAG_SIZE, height: FLAG_SIZE }}
            title={name}
          >
            <Image
              src={`https://a.espncdn.com/i/teamlogos/countries/500/${abbr}.png`}
              alt={name}
              width={FLAG_SIZE}
              height={FLAG_SIZE}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { t } = useApp();

  async function handleGoogleLogin() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black">
      {/* Stadium background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={stadiumBg}
          alt="Estádio"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* ── Top flag strip ── */}
      <div className="relative z-10 w-full py-3" style={{ background: "rgba(0,0,0,0.35)" }}>
        <FlagStrip nations={ROW_TOP} direction="left" />
      </div>

      {/* ── Center card ── */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-6">
        <div className="relative">
          {/* Card */}
          <div
            className="relative flex flex-col items-center rounded-3xl px-8 pb-6 pt-4 text-center shadow-2xl"
            style={{
              background: "linear-gradient(175deg, #1b6b35 0%, #0d3d1c 55%, #082810 100%)",
              border: "2px solid rgba(255,255,255,0.12)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
              width: 340,
              minHeight: 380,
            }}
          >
            {/* Trophy — floats above card */}
            <div className="relative -mt-16 mb-2" style={{ width: 110, height: 130 }}>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 70% at 50% 60%, rgba(255,200,40,0.55) 0%, rgba(255,160,0,0.25) 45%, transparent 75%)",
                  filter: "blur(8px)",
                  transform: "scale(1.3)",
                }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse 120% 100% at 50% 65%, rgba(255,215,80,0.18) 0%, transparent 70%)",
                  filter: "blur(14px)",
                  transform: "scale(1.7)",
                }}
                aria-hidden="true"
              />
              <Image
                src={trophy}
                alt="Troféu"
                fill
                className="relative object-contain drop-shadow-2xl"
                sizes="110px"
              />
            </div>

            <h1
              className="text-2xl font-black uppercase tracking-widest"
              style={{ color: "#f5c842", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
            >
              MATAMATA.LIVE
            </h1>

            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/60">
              Copa do Mundo 2026 &bull; Final 19 Jul
            </p>

            <p className="mt-3 text-sm leading-snug text-white/80">{t("tagline")}</p>

            {/* Google sign-in */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="group flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                aria-label={t("signInGoogle")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="h-8 w-8"
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
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              </button>
              <p className="text-sm font-semibold text-white/90">{t("signInGoogle")}</p>
            </div>

            <p className="mt-5 text-[10px] text-white/30">© 2026 MataMata.live</p>
          </div>

          {/* Mascot — right side of card */}
          <div
            className="pointer-events-none absolute drop-shadow-2xl"
            style={{ width: 130, height: 150, right: -65, bottom: 56, zIndex: 20 }}
          >
            <Image src={mascot} alt="Mascote" fill className="object-contain" sizes="130px" />
          </div>
        </div>
      </div>

      {/* ── Bottom flag strip ── */}
      <div className="relative z-10 w-full py-3" style={{ background: "rgba(0,0,0,0.35)" }}>
        <FlagStrip nations={ROW_BOTTOM} direction="right" />
      </div>
    </div>
  );
}
