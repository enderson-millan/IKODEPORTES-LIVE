import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

/** Circular IKODEPORTES mark. */
export function BrandLogo({ size = 40, className, priority }: BrandLogoProps) {
  return (
    <Image
      src={BRAND.logo.src}
      alt={BRAND.logo.alt}
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-full", className)}
    />
  );
}

interface BrandWordmarkProps {
  className?: string;
  /** Renders the smaller "LIVE" chip next to the mark. */
  withLive?: boolean;
}

/** Text mark: gold "IKO" + foreground "DEPORTES", optional LIVE chip. */
export function BrandWordmark({ className, withLive = true }: BrandWordmarkProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="font-display text-lg font-extrabold uppercase leading-none tracking-wide">
        <span className="text-brand-gold">IKO</span>
        <span className="text-foreground">DEPORTES</span>
      </span>
      {withLive && (
        <span className="rounded-sm bg-live px-1.5 py-0.5 text-[10px] font-black uppercase leading-none tracking-widest text-white">
          Live
        </span>
      )}
    </span>
  );
}
