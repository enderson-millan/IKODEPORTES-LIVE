/**
 * Single source of truth for IKODEPORTES Live brand assets and copy.
 *
 * The circular logo is an own vector (S12: no league/club trademarks). To use
 * the official raster artwork, drop `logo-circular.jpg` into `public/images/`
 * and point `logo.src` at it — nothing else needs to change.
 */
export const BRAND = {
  /** Product name, used in `<title>` and the header. */
  name: "IKODEPORTES Live",
  /** Brand mark, uppercase. */
  mark: "IKODEPORTES",
  /** Brand claim. Never translated: it is part of the mark. */
  slogan: "EL DEPORTE, EN CONTEXTO.",
  /** Public web app origin. */
  siteUrl: "https://live.ikodeportes.com",
  logo: {
    src: "/images/logo-circular.svg",
    alt: "IKODEPORTES",
    width: 512,
    height: 512,
  },
  colors: {
    night: "#070D1A",
    surface: "#0D172A",
    surfaceRaised: "#12203A",
    gold: "#FACC15",
    goldStrong: "#EAB308",
    blue: "#2563EB",
    blueStrong: "#1D4ED8",
    red: "#DC2626",
  },
} as const;
