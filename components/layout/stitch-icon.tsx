import { cn } from "@/lib/utils";

export function StitchIcon({
  name,
  filled,
  className,
  size = 20,
}: {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "material-symbols-outlined shrink-0",
        filled && "nr-icon-filled",
        className
      )}
      style={{ fontSize: size }}
      aria-hidden
    >
      {name}
    </span>
  );
}
