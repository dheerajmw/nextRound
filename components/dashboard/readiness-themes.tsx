import type { ThemeRollup } from "@/lib/readiness/types";

function ThemeList({
  title,
  items,
  emptyMessage,
  variant,
}: {
  title: string;
  items: ThemeRollup[];
  emptyMessage: string;
  variant: "strength" | "weakness";
}) {
  return (
    <div className="space-y-2">
      <h4
        className={
          variant === "strength"
            ? "text-sm font-medium text-emerald-600 dark:text-emerald-400"
            : "text-sm font-medium text-amber-600 dark:text-amber-400"
        }
      >
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.text}
              className="flex items-start justify-between gap-2 text-sm"
            >
              <span className="text-muted-foreground">{item.text}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                ×{item.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReadinessThemes({
  strengths,
  weaknesses,
}: {
  strengths: ThemeRollup[];
  weaknesses: ThemeRollup[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <ThemeList
        title="Top strengths"
        items={strengths}
        emptyMessage="Complete more interviews to surface recurring strengths."
        variant="strength"
      />
      <ThemeList
        title="Areas to improve"
        items={weaknesses}
        emptyMessage="Complete more interviews to surface recurring themes."
        variant="weakness"
      />
    </div>
  );
}
