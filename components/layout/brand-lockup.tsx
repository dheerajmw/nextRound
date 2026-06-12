import Link from "next/link";
import type { MouseEvent } from "react";
import { StitchIcon } from "@/components/layout/stitch-icon";
import { cn } from "@/lib/utils";

export function BrandLockup({
  href = "/",
  compact,
  className,
  onNavigate,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn("flex items-center gap-3", className)}
    >
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
        <StitchIcon
          name="psychology"
          filled
          className="text-primary-foreground"
          size={20}
        />
      </div>
      <div className={cn(compact && "hidden sm:block")}>
        <p className="text-base font-bold tracking-tight text-primary">
          nextRound
        </p>
        {!compact ? (
          <p className="nr-label-caps text-[10px] leading-none">
            Pro Intelligence
          </p>
        ) : null}
      </div>
    </Link>
  );
}
