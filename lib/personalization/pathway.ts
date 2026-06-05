const PATHWAY_LABELS: Record<string, string> = {
  behavioral_week_1: "Behavioral — Week 1: STAR basics",
  behavioral_week_2: "Behavioral — Week 2: Impact stories",
  behavioral_week_3: "Behavioral — Week 3: Leadership & conflict",
  hr_week_1: "HR — Week 1: Culture fit",
  hr_week_2: "HR — Week 2: Motivation & values",
  pm_week_1: "PM — Week 1: Product sense",
  pm_week_2: "PM — Week 2: Metrics & tradeoffs",
  technical_week_1: "Technical — Week 1: Problem framing",
  technical_week_2: "Technical — Week 2: Deep dives",
};

export function formatPathwayStep(step: string | null | undefined): string {
  if (!step?.trim()) return "Getting started";
  const key = step.trim().toLowerCase();
  return PATHWAY_LABELS[key] ?? step.replace(/_/g, " ");
}

export function suggestPathwayStep(params: {
  mode: string;
  sessionCount: number;
  avgOverall: number;
}): string {
  const mode = params.mode.replace(/[^a-z]/gi, "") || "behavioral";
  const week =
    params.avgOverall >= 75
      ? 3
      : params.avgOverall >= 55 || params.sessionCount >= 3
        ? 2
        : 1;
  return `${mode}_week_${week}`;
}
