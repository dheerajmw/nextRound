import type { EvaluationScores } from "@/lib/evaluation/types";

export type OrgMemberRole = "admin" | "coach" | "member";

export type OrganizationDto = {
  id: string;
  name: string;
  slug: string;
  brand_name: string | null;
  llm_daily_cap: number;
  created_at: string;
};

export type OrgMembershipDto = {
  org_id: string;
  role: OrgMemberRole;
  organization: OrganizationDto;
};

export type CohortDto = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type CohortMemberDto = {
  id: string;
  cohort_id: string;
  email: string;
  user_id: string | null;
  status: "pending" | "active";
  invited_at: string;
  joined_at: string | null;
};

export type CohortMemberSummary = {
  member_id: string;
  label: string;
  session_count: number;
  completed_scored_count: number;
  readiness_index: number | null;
  avg_overall: number | null;
};

export type CohortAnalytics = {
  cohort_id: string;
  cohort_name: string;
  member_count: number;
  active_member_count: number;
  pending_invites: number;
  avg_readiness_index: number | null;
  avg_scores: EvaluationScores | null;
  members: CohortMemberSummary[];
  /** No answer text or questions — aggregate only */
  privacy_note: string;
};

export type CoachMenteeSummary = {
  user_id: string;
  display_name: string | null;
  target_role: string | null;
  session_count: number;
  readiness_index: number | null;
  last_session_at: string | null;
};
