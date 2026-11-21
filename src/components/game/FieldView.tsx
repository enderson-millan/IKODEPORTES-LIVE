import type { CanonicalBaseballState } from "@shared/types/baseball-state";
import { cn } from "@/lib/utils";

interface FieldViewProps {
  state: CanonicalBaseballState;
  className?: string;
}

const BASE_POSITIONS = {
  first: { x: 700, y: 430 },
  second: { x: 500, y: 300 },
  third: { x: 300, y: 430 },
} as const;

const DEFENSE_POSITIONS: Record<string, { x: number; y: number }> = {
  P: { x: 500, y: 445 },
  C: { x: 500, y: 600 },
  "1B": { x: 690, y: 450 },
  "2B": { x: 610, y: 340 },
  "3B": { x: 310, y: 450 },
  SS: { x: 390, y: 340 },
  LF: { x: 210, y: 240 },
  CF: { x: 500, y: 150 },
  RF: { x: 790, y: 240 },
};

/**
 * StatsAPI reports batted balls as `coordX`/`coordY` with home plate around
 * (125, 200) and the outfield toward y=0. This maps that space onto the SVG.
 */
function hitToField(x: number, y: number): { x: number; y: number } {
  const mappedX = 500 + (x - 125) * 3.2;
  const mappedY = 560 - (200 - y) * 2.4;
  return {
    x: Math.min(930, Math.max(70, mappedX)),
    y: Math.min(600, Math.max(70, mappedY)),
  };
}

function lastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : fullName;
}

function Base({ x, y, occupied }: { x: number; y: number; occupied: boolean }) {
  return (
    <rect
      x={x - 13}
      y={y - 13}
      width={26}
      height={26}
      rx={3}
      transform={`rotate(45 ${x} ${y})`}
      className="transition-colors"
      fill={occupied ? "var(--brand-gold)" : "rgba(248,250,252,0.22)"}
      stroke={occupied ? "var(--brand-gold-strong)" : "rgba(248,250,252,0.55)"}
      strokeWidth={1.5}
    />
  );
}

/**
 * Live field: defense alignment, runners on base, batter and the last batted
 * ball. Pure SVG so it stays crisp on the OBS 1920x1080 canvas.
 */
export function FieldView({ state, className }: FieldViewProps) {
  const runners = [
    {
      key: "first",
      occupied: state.bases.first,
      position: BASE_POSITIONS.first,
      runner: state.bases.firstRunner,
    },
    {
      key: "second",
      occupied: state.bases.second,
      position: BASE_POSITIONS.second,
      runner: state.bases.secondRunner,
    },
    {
      key: "third",
      occupied: state.bases.third,
      position: BASE_POSITIONS.third,
      runner: state.bases.thirdRunner,
    },
  ];

  const lastHit = [...state.playByPlay].reverse().find((play) => play.hit)?.hit;
  const hitPoint = lastHit ? hitToField(lastHit.x, lastHit.y) : null;

  return (
    <svg
      viewBox="0 0 1000 640"
      role="img"
      aria-label="Campo con corredores y defensa"
      className={cn("h-full w-full", className)}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="iko-grass" cx="50%" cy="70%" r="75%">
          <stop offset="0%" stopColor="#14532d" />
          <stop offset="60%" stopColor="#0b3b24" />
          <stop offset="100%" stopColor="#052318" />
        </radialGradient>
        <linearGradient id="iko-dirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a5426" />
          <stop offset="100%" stopColor="#4a2a11" />
        </linearGradient>
        <radialGradient id="iko-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="55%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>
      </defs>

      <rect x={0} y={0} width={1000} height={640} rx={20} fill="#05130f" />
      <path
        d="M120 220 A 500 500 0 0 1 880 220 L 700 430 L 500 300 L 300 430 Z"
        fill="url(#iko-grass)"
      />
      {/* Outfield wall + warning track */}
      <path
        d="M120 220 A 500 500 0 0 1 880 220"
        fill="none"
        stroke="rgba(250,250,250,0.35)"
        strokeWidth={6}
      />
      {/* Foul lines */}
      <path d="M500 560 L120 220" stroke="rgba(248,250,252,0.35)" strokeWidth={2.5} />
      <path d="M500 560 L880 220" stroke="rgba(248,250,252,0.35)" strokeWidth={2.5} />

      {/* Infield dirt + base paths */}
      <path d="M500 560 L700 430 L500 300 L300 430 Z" fill="url(#iko-dirt)" opacity={0.95} />
      <path
        d="M500 560 L700 430 L500 300 L300 430 Z"
        fill="none"
        stroke="rgba(248,250,252,0.28)"
        strokeWidth={2}
      />
      <ellipse cx={500} cy={445} rx={34} ry={20} fill="rgba(248,250,252,0.12)" />
      <ellipse cx={500} cy={445} rx={7} ry={4} fill="rgba(248,250,252,0.45)" />

      <Base x={BASE_POSITIONS.first.x} y={BASE_POSITIONS.first.y} occupied={state.bases.first} />
      <Base x={BASE_POSITIONS.second.x} y={BASE_POSITIONS.second.y} occupied={state.bases.second} />
      <Base x={BASE_POSITIONS.third.x} y={BASE_POSITIONS.third.y} occupied={state.bases.third} />

      {/* Home plate */}
      <path
        d="M500 548 L512 555 L512 568 L488 568 L488 555 Z"
        fill="rgba(248,250,252,0.85)"
        stroke="rgba(15,23,42,0.6)"
        strokeWidth={1.5}
      />

      {/* Last batted ball */}
      {hitPoint && (
        <g>
          <line
            x1={500}
            y1={560}
            x2={hitPoint.x}
            y2={hitPoint.y}
            stroke="rgba(250,204,21,0.35)"
            strokeWidth={2}
            strokeDasharray="6 7"
          />
          <circle
            cx={hitPoint.x}
            cy={hitPoint.y}
            r={11}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={3}
          />
          <circle cx={hitPoint.x} cy={hitPoint.y} r={4.5} fill="var(--brand-red)" />
        </g>
      )}

      {/* Runners */}
      {runners.map(({ key, occupied, position, runner }) => {
        if (!occupied) return null;
        return (
          <g key={key} transform={`translate(${position.x} ${position.y})`}>
            <circle r={17} fill="var(--brand-gold)" stroke="#f8fafc" strokeWidth={2} />
            <text
              textAnchor="middle"
              y={5}
              fontSize={13}
              fontWeight={900}
              fill="#070d1a"
              className="tabular-nums"
            >
              {runner?.jerseyNumber ?? "•"}
            </text>
            {runner && (
              <text
                textAnchor="middle"
                y={-26}
                fontSize={11}
                fontWeight={700}
                fill="#f8fafc"
                style={{ paintOrder: "stroke", stroke: "rgba(3,10,20,0.85)", strokeWidth: 3 }}
              >
                {lastName(runner.name)}
              </text>
            )}
          </g>
        );
      })}

      {/* Defense */}
      {state.defense.map((slot) => {
        const position = DEFENSE_POSITIONS[slot.position];
        if (!position) return null;
        return (
          <g
            key={`${slot.position}-${slot.playerName}`}
            transform={`translate(${position.x} ${position.y})`}
          >
            <circle r={20} fill="rgba(7,13,26,0.9)" stroke="var(--brand-gold)" strokeWidth={2.5} />
            <text
              textAnchor="middle"
              y={5}
              fontSize={13}
              fontWeight={900}
              fill="#f8fafc"
              className="tabular-nums"
            >
              {slot.jerseyNumber ?? "—"}
            </text>
            <text
              textAnchor="middle"
              y={-29}
              fontSize={12}
              fontWeight={900}
              fill="var(--brand-gold)"
            >
              {slot.position}
            </text>
            <text
              textAnchor="middle"
              y={37}
              fontSize={11}
              fill="rgba(248,250,252,0.78)"
              style={{ paintOrder: "stroke", stroke: "rgba(3,10,20,0.8)", strokeWidth: 3 }}
            >
              {lastName(slot.playerName)}
            </text>
          </g>
        );
      })}

      {/* Batter chip */}
      {state.atBat && (
        <g transform="translate(500 612)">
          <rect
            x={-160}
            y={-16}
            width={320}
            height={32}
            rx={16}
            fill="rgba(7,13,26,0.92)"
            stroke="var(--brand-gold)"
            strokeWidth={1.5}
          />
          <text textAnchor="middle" y={5} fontSize={14} fontWeight={800} fill="#f8fafc">
            {state.atBat.batter.name}
          </text>
        </g>
      )}

      <rect x={0} y={0} width={1000} height={640} rx={20} fill="url(#iko-vignette)" />
    </svg>
  );
}
