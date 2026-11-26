/**
 * Single source of truth for IKODEPORTES Live brand assets and copy.
 *
 * `logo-circular.svg` is the own vector master (used when a crisp mark is
 * needed); `logo-circular.jpg` is the official raster artwork (638x638) and is
 * the one wired below. Paths are lowercase on purpose: the containers run on a
 * case-sensitive filesystem, so `LOGO-CIRCULAR.jpg` would 404 in production
 * while still working on Windows.
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
    src: "/images/logo-circular.jpg",
    alt: "IKODEPORTES",
    width: 638,
    height: 638,
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
