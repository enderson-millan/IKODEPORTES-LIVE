import type { BasesState } from "@shared/types/baseball-state";
import { cn } from "@/lib/utils";

interface BasesDiamondProps {
  bases: BasesState;
  className?: string;
}

const BASE_SIZE = 20;

function Base({ x, y, occupied }: { x: number; y: number; occupied: boolean }) {
  return (
    <rect
      x={x - BASE_SIZE / 2}
      y={y - BASE_SIZE / 2}
      width={BASE_SIZE}
      height={BASE_SIZE}
      rx={3}
      transform={`rotate(45 ${x} ${y})`}
      className={cn(
        "transition-colors",
        occupied ? "fill-brand-gold stroke-brand-gold-strong" : "fill-white/10 stroke-white/30",
      )}
      strokeWidth={1.5}
    />
  );
}

/** Stylized infield diamond with the occupied bases highlighted. */
export function BasesDiamond({ bases, className }: BasesDiamondProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label="Base occupancy"
      className={cn("h-32 w-32", className)}
    >
      <path
        d="M60 18 L102 60 L60 102 L18 60 Z"
        className="fill-none stroke-white/15"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d="M60 102 L74 88 L60 74 L46 88 Z" className="fill-white/5" />
      <Base x={60} y={18} occupied={bases.second} />
      <Base x={102} y={60} occupied={bases.first} />
      <Base x={18} y={60} occupied={bases.third} />
      <circle cx={60} cy={104} r={4} className="fill-white/60" />
    </svg>
  );
}
