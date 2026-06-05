import type { InterviewMode } from "@/lib/supabase/database.types";
import type { RoleTemplate, RubricWeights } from "@/lib/enrichment/types";

const DEFAULT_WEIGHTS: RubricWeights = {
  communication: 0.25,
  structure: 0.25,
  content: 0.3,
  logical_flow: 0.2,
};

const MODE_DEFAULTS: Record<
  InterviewMode,
  { role_key: string; display_name: string; competencies: string[]; rubric_weights: RubricWeights }
> = {
  pm: {
    role_key: "product_manager",
    display_name: "Product Manager",
    competencies: [
      "Product sense and prioritization",
      "Metrics and experimentation",
      "Stakeholder alignment",
    ],
    rubric_weights: {
      communication: 0.22,
      structure: 0.23,
      content: 0.35,
      logical_flow: 0.2,
    },
  },
  technical: {
    role_key: "software_engineer",
    display_name: "Software Engineer",
    competencies: [
      "Problem solving",
      "System design",
      "Technical depth",
    ],
    rubric_weights: {
      communication: 0.18,
      structure: 0.22,
      content: 0.4,
      logical_flow: 0.2,
    },
  },
  hr: {
    role_key: "hr_generalist",
    display_name: "HR",
    competencies: [
      "Culture fit",
      "Communication",
      "Conflict handling",
    ],
    rubric_weights: {
      communication: 0.35,
      structure: 0.25,
      content: 0.25,
      logical_flow: 0.15,
    },
  },
  behavioral: {
    role_key: "behavioral_general",
    display_name: "Behavioral",
    competencies: [
      "STAR structure",
      "Ownership",
      "Measurable impact",
    ],
    rubric_weights: DEFAULT_WEIGHTS,
  },
};

export function getDefaultRoleTemplate(mode: InterviewMode): RoleTemplate {
  const d = MODE_DEFAULTS[mode];
  return {
    role_key: d.role_key,
    display_name: d.display_name,
    competencies: d.competencies,
    rubric_weights: d.rubric_weights,
    onet_codes: [],
  };
}
