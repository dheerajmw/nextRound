import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { LandingHeroPreview } from "@/components/marketing/landing-hero-preview";
import { StitchIcon } from "@/components/layout/stitch-icon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_NEXT = "/interviews/new";

const FEATURES = [
  {
    icon: "videocam",
    title: "AI mock interviews",
    description:
      "Adaptive questions that probe deeper into your answers—like a real lead engineer.",
    span: "md:col-span-8",
    accent: "primary",
  },
  {
    icon: "trending_up",
    title: "Real-time analysis",
    description:
      "Scores for clarity, structure, and content—with delivery signals as you practice.",
    span: "md:col-span-4",
    accent: "tertiary",
    tinted: true,
  },
  {
    icon: "assignment_turned_in",
    title: "Personalized plans",
    description:
      "Practice tasks generated from your gaps and target role.",
    span: "md:col-span-4",
    accent: "secondary",
  },
  {
    icon: "psychology",
    title: "Behavioral depth",
    description:
      "STAR-aware feedback on narrative structure and leadership impact.",
    span: "md:col-span-8",
    accent: "primary",
  },
] as const;

const BENCHMARK_POINTS = [
  "Percentile ranking by interview type",
  "Role-specific difficulty scaling",
  "Market-readiness scoring over time",
];

function sessionHref(user: User | null) {
  return user
    ? DEFAULT_NEXT
    : `/signup?next=${encodeURIComponent(DEFAULT_NEXT)}`;
}

export function LandingPage({
  user,
  displayName,
}: {
  user: User | null;
  displayName?: string | null;
}) {
  const isAuthenticated = Boolean(user);
  const startHref = sessionHref(user);
  const firstName = displayName?.trim().split(/\s+/)[0];

  return (
    <div className="relative z-[1]">
      <section className="relative overflow-visible flex min-h-[calc(100vh-4rem)] items-center px-6 py-20 pb-28 md:px-10 lg:pb-20">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-16 overflow-visible lg:grid-cols-2">
          <div className="order-1 space-y-8 lg:order-none">
            <div className="nr-pill nr-pill--primary inline-flex">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              {isAuthenticated && firstName
                ? `Welcome back, ${firstName}`
                : "AI interview readiness"}
            </div>
            <h1 className="nr-display-hero nr-text-glow">
              Practice interviews that make you{" "}
              <span className="nr-gradient-text">measurably</span> better
            </h1>
            <p className="nr-body-muted max-w-xl text-lg">
              nextRound simulates realistic mocks, scores your answers, and
              tracks readiness—so you walk in prepared, not anxious.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={startHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "px-8 font-mono text-[13px] font-bold tracking-wide"
                )}
              >
                {isAuthenticated
                  ? "Start a mock interview"
                  : "Start your first session"}
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "px-8 font-mono text-[13px] font-bold tracking-wide"
                  )}
                >
                  View dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "px-8 font-mono text-[13px] font-bold tracking-wide"
                  )}
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
          <div className="relative order-2 overflow-visible pb-12 lg:order-none lg:pb-16">
            <LandingHeroPreview />
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto max-w-7xl px-6 py-24 md:px-10"
      >
        <div className="mb-16 space-y-4 text-center">
          <h2 className="nr-headline-lg">Everything you need to land the offer</h2>
          <p className="nr-body-muted mx-auto max-w-lg">
            Engineered for candidates targeting competitive tech and product roles.
          </p>
        </div>
        <div className="grid grid-cols-12 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={cn(
                "col-span-12 nr-glass-card p-8 md:p-10",
                f.span,
                "tinted" in f && f.tinted &&
                  "border-[#ffb786]/20 bg-[#ffb786]/5 backdrop-blur-md"
              )}
            >
              <StitchIcon
                name={f.icon}
                className={cn(
                  "mb-4 text-4xl",
                  f.accent === "tertiary" ? "text-[#ffb786]" : "text-primary"
                )}
                size={36}
              />
              <h3 className="mb-3 text-xl font-medium tracking-tight">
                {f.title}
              </h3>
              <p className="nr-body-muted max-w-md">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="benchmarks"
        className="border-y border-border/30 bg-[#0e0e0f] py-24"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 md:px-10 lg:grid-cols-2">
          <div className="space-y-6">
            <h2 className="nr-headline-lg">Peer benchmark</h2>
            <p className="text-lg text-muted-foreground">
              See where you stand against others practicing for the same roles—with
              percentile rankings on your dashboard.
            </p>
            <ul className="space-y-4">
              {BENCHMARK_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-3 font-mono text-[13px] text-muted-foreground"
                >
                  <StitchIcon
                    name="check_circle"
                    className="text-primary"
                    size={20}
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="nr-glass-card p-8">
            <div className="space-y-6">
              <div className="flex items-end justify-between gap-2">
                {[40, 55, 48, 72, 65, 80, 78].map((h, i) => (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div
                      className="w-full rounded-t bg-primary/25 transition-colors hover:bg-primary/40"
                      style={{ height: `${h * 1.2}px` }}
                    />
                    <span className="font-mono text-[10px] text-muted-foreground opacity-60">
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="nr-label-caps text-center">Practice frequency</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10">
        <h2 className="nr-headline-lg mb-4">Ready for your next round?</h2>
        <p className="nr-body-muted mb-8">
          {isAuthenticated
            ? "Pick up a mock interview, chat with your career coach, or review progress on the dashboard."
            : "Create a free account and complete your first scored mock in minutes."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={startHref}
            className={cn(
              buttonVariants({ size: "lg" }),
              "px-10 font-mono font-bold"
            )}
          >
            {isAuthenticated ? "Start a mock interview" : "Get started free"}
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                href="/coach"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "px-8 font-mono font-bold"
                )}
              >
                Career coach
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ size: "lg", variant: "ghost" }),
                  "px-8 font-mono font-bold"
                )}
              >
                Dashboard
              </Link>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
