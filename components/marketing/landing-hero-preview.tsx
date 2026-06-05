import { StitchIcon } from "@/components/layout/stitch-icon";
import { cn } from "@/lib/utils";

const WAVE_HEIGHTS = [18, 28, 22, 36, 30, 34, 20, 32, 26, 38, 24, 30];

const SCORES = [
  { label: "Clarity", value: 82 },
  { label: "Structure", value: 76 },
  { label: "Content", value: 79 },
];

function ReadinessRing({ value }: { value: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden>
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-border/50"
      />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
        className="text-primary"
      />
    </svg>
  );
}

export function LandingHeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 top-1/3 size-32 rounded-full bg-[#ffb786]/10 blur-3xl"
        aria-hidden
      />

      <div className="nr-glass-card relative overflow-hidden rounded-2xl border border-border/60 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-[var(--nr-surface-container-low)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="nr-label-caps hidden text-[10px] sm:inline">
              Live session
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1">
            <span className="size-2 animate-pulse rounded-full bg-red-400" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-red-300">
              Recording
            </span>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-primary">
            08:24
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5">
          <div className="border-b border-border/30 bg-[var(--nr-surface-container)] p-4 sm:col-span-2 sm:border-b-0 sm:border-r">
            <p className="nr-label-caps mb-3 text-[10px]">Interviewer</p>
            <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-[var(--nr-surface-container-high)] via-[var(--nr-surface-container-low)] to-primary/10">
              <div className="aspect-[4/3] flex items-end justify-center bg-[radial-gradient(ellipse_at_50%_20%,rgba(173,198,255,0.25),transparent_60%)]">
                <div className="mb-4 flex size-20 items-center justify-center rounded-full border-2 border-primary/30 bg-[var(--nr-surface-container-high)] shadow-lg shadow-primary/10">
                  <StitchIcon
                    name="smart_toy"
                    filled
                    className="text-primary"
                    size={36}
                  />
                </div>
              </div>
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md border border-primary/20 bg-black/40 px-2 py-1 backdrop-blur-sm">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-200">
                  Active
                </span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium">Alex · AI interviewer</p>
              <p className="text-xs text-muted-foreground">Behavioral · adaptive</p>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:col-span-3">
            <div>
              <p className="nr-label-caps mb-2 text-[10px]">Question 3 of 5</p>
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 shadow-[inset_0_1px_0_rgba(173,198,255,0.08)]">
                <p className="text-sm leading-relaxed text-foreground">
                  Tell me about a time you led a project with unclear requirements.
                  How did you align stakeholders?
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-[var(--nr-surface-container-low)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="nr-label-caps text-[10px]">Your response</span>
                <StitchIcon name="mic" className="text-primary" size={16} />
              </div>
              <div className="flex h-10 items-end justify-center gap-1">
                {WAVE_HEIGHTS.map((h, i) => (
                  <span
                    key={i}
                    className="nr-hero-wave-bar w-1 rounded-full bg-primary/70"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {SCORES.map((score) => (
                <div
                  key={score.label}
                  className="rounded-lg border border-border/40 bg-[var(--nr-surface-container-low)] px-2 py-2 text-center"
                >
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {score.label}
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-primary">
                    {score.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Session progress</span>
                <span className="text-primary">3 / 5</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border/40">
                <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-primary/80 to-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "absolute -bottom-5 -right-2 sm:-right-6",
          "nr-glass-card flex items-center gap-3 rounded-xl border border-primary/30 p-3.5",
          "shadow-xl shadow-primary/10 backdrop-blur-md",
          "animate-[nr-float_4s_ease-in-out_infinite]"
        )}
      >
        <ReadinessRing value={78} />
        <div>
          <p className="nr-label-caps text-[10px]">Readiness</p>
          <p className="text-2xl font-semibold tabular-nums text-primary">78%</p>
          <p className="font-mono text-[9px] text-muted-foreground">
            +6 vs last week
          </p>
        </div>
      </div>
    </div>
  );
}
