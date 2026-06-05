import type { InterviewDifficulty } from "@/lib/interview/constants";
import type { InterviewMode } from "@/lib/supabase/database.types";

export type RubricWeights = {
  communication: number;
  structure: number;
  content: number;
  logical_flow: number;
};

export type RoleTemplate = {
  role_key: string;
  display_name: string;
  competencies: string[];
  rubric_weights: RubricWeights;
  onet_codes: string[];
};

export type ProfileSkills = {
  items: string[];
  summary?: string;
  extracted_at?: string;
};

export type BankQuestion = {
  id: string;
  role_key: string | null;
  mode: InterviewMode;
  difficulty: InterviewDifficulty;
  text: string;
  tags: string[];
  source: string;
};

export type EnrichmentContext = {
  role_key: string;
  role_template: RoleTemplate;
  skills: ProfileSkills | null;
  competencies: string[];
  rubric_weights: RubricWeights;
};
