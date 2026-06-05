export type MediaAnalysisResult = {
  confidence_score: number;
  delivery_score: number;
  emotion_summary: string;
  filler_assessment: string;
  recommendations: string[];
};

export type BenchmarkResult = {
  readiness_index: number | null;
  percentile: number | null;
  cohort_label: string;
  sample_size: number;
  comparison: "global" | "cohort";
};

export type CompanyProfile = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  interview_focus: string | null;
  question_pack: string[];
};

export type PeerSessionDto = {
  id: string;
  join_code: string;
  status: string;
  mode: string;
  target_role: string | null;
  host_user_id: string;
  partner_user_id: string | null;
  host_session_id: string | null;
  partner_session_id: string | null;
  created_at: string;
};
