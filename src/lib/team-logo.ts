/**
 * Team crests live in `public/teams/<code>.<ext>`.
 *
 * The canonical contract stays vendor-agnostic: `TeamIdentity.logoUrl` is
 * optional and, when a feed provides it, that wins. This map is the local
 * fallback keyed by the 3-letter team code, so the UI can show a crest even
 * when the feed only knows the code. Add a row when a file is dropped into
 * `public/teams/`; a missing file simply falls back to the code badge.
 */
export const TEAM_LOGOS: Record<string, string> = {
  CAR: "/teams/leones.png",
  MAG: "/teams/magallanes.png",
};

/** Crest path for a team code, or `undefined` when none is registered. */
export function teamLogo(code?: string): string | undefined {
  if (!code) return undefined;
  return TEAM_LOGOS[code.toUpperCase()];
}
