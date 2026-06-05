export type InterviewMode =
  | "behavioral"
  | "hr"
  | "pm"
  | "technical";

export type InterviewSessionStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "cancelled";

export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewInputMode = "text" | "voice" | "both";
export type InterviewTurnType = "primary" | "follow_up";

export type PracticeTaskType = "retry" | "exercise" | "pathway";
export type PracticeTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped";

export type OrgMemberRole = "admin" | "coach" | "member";
export type CohortMemberStatus = "pending" | "active";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EvaluationScoresJson = {
  communication: number;
  structure: number;
  content: number;
  logical_flow: number;
  overall: number;
};

export type EvaluationFeedbackJson = {
  star_detected: boolean;
  filler_word_count: number;
  strengths: string[];
  improvements: string[];
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          target_role: string | null;
          resume_url: string | null;
          skills: Json | null;
          media_consent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          target_role?: string | null;
          resume_url?: string | null;
          skills?: Json | null;
          media_consent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          target_role?: string | null;
          resume_url?: string | null;
          skills?: Json | null;
          media_consent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_profiles: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          interview_focus: string | null;
          question_pack: Json;
          rubric_emphasis: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          interview_focus?: string | null;
          question_pack?: Json;
          rubric_emphasis?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          interview_focus?: string | null;
          question_pack?: Json;
          rubric_emphasis?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      role_templates: {
        Row: {
          role_key: string;
          display_name: string;
          competencies: Json;
          rubric_weights: Json;
          onet_codes: string[];
          created_at: string;
        };
        Insert: {
          role_key: string;
          display_name: string;
          competencies?: Json;
          rubric_weights: Json;
          onet_codes?: string[];
          created_at?: string;
        };
        Update: {
          role_key?: string;
          display_name?: string;
          competencies?: Json;
          rubric_weights?: Json;
          onet_codes?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      question_bank: {
        Row: {
          id: string;
          role_key: string | null;
          mode: InterviewMode;
          difficulty: InterviewDifficulty;
          text: string;
          tags: string[];
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          role_key?: string | null;
          mode: InterviewMode;
          difficulty?: InterviewDifficulty;
          text: string;
          tags?: string[];
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          role_key?: string | null;
          mode?: InterviewMode;
          difficulty?: InterviewDifficulty;
          text?: string;
          tags?: string[];
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      interview_sessions: {
        Row: {
          id: string;
          user_id: string;
          status: InterviewSessionStatus;
          mode: InterviewMode;
          target_role: string | null;
          session_scores: EvaluationScoresJson | null;
          adaptive: boolean;
          difficulty: InterviewDifficulty;
          input_mode: InterviewInputMode;
          max_followups_per_topic: number;
          main_questions_completed: number;
          current_topic_followups: number;
          question_limit: number;
          practice_task_id: string | null;
          company_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: InterviewSessionStatus;
          mode?: InterviewMode;
          target_role?: string | null;
          session_scores?: EvaluationScoresJson | null;
          adaptive?: boolean;
          difficulty?: InterviewDifficulty;
          input_mode?: InterviewInputMode;
          max_followups_per_topic?: number;
          main_questions_completed?: number;
          current_topic_followups?: number;
          question_limit?: number;
          practice_task_id?: string | null;
          company_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: InterviewSessionStatus;
          mode?: InterviewMode;
          target_role?: string | null;
          session_scores?: EvaluationScoresJson | null;
          adaptive?: boolean;
          difficulty?: InterviewDifficulty;
          input_mode?: InterviewInputMode;
          max_followups_per_topic?: number;
          main_questions_completed?: number;
          current_topic_followups?: number;
          question_limit?: number;
          practice_task_id?: string | null;
          company_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      practice_plans: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          summary: string;
          pathway_step: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          summary: string;
          pathway_step?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          summary?: string;
          pathway_step?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      practice_tasks: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string;
          type: PracticeTaskType;
          title: string;
          instructions: string;
          payload: Json;
          status: PracticeTaskStatus;
          due_at: string | null;
          completed_at: string | null;
          retry_session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id: string;
          type: PracticeTaskType;
          title: string;
          instructions: string;
          payload?: Json;
          status?: PracticeTaskStatus;
          due_at?: string | null;
          completed_at?: string | null;
          retry_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          user_id?: string;
          type?: PracticeTaskType;
          title?: string;
          instructions?: string;
          payload?: Json;
          status?: PracticeTaskStatus;
          due_at?: string | null;
          completed_at?: string | null;
          retry_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_readiness_snapshots: {
        Row: {
          id: string;
          user_id: string;
          snapshot_date: string;
          metrics: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          snapshot_date?: string;
          metrics: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          snapshot_date?: string;
          metrics?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      evaluations: {
        Row: {
          id: string;
          turn_id: string;
          session_id: string;
          scores: EvaluationScoresJson;
          feedback: EvaluationFeedbackJson;
          prompt_version: string;
          model: string;
          provider: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          turn_id: string;
          session_id: string;
          scores: EvaluationScoresJson;
          feedback: EvaluationFeedbackJson;
          prompt_version?: string;
          model: string;
          provider: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          turn_id?: string;
          session_id?: string;
          scores?: EvaluationScoresJson;
          feedback?: EvaluationFeedbackJson;
          prompt_version?: string;
          model?: string;
          provider?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      interview_turns: {
        Row: {
          id: string;
          session_id: string;
          turn_index: number;
          question: string;
          rationale: string | null;
          answer_text: string | null;
          transcript: string | null;
          turn_type: InterviewTurnType;
          primary_question_index: number | null;
          audio_url: string | null;
          created_at: string;
          answered_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          turn_index: number;
          question: string;
          rationale?: string | null;
          answer_text?: string | null;
          transcript?: string | null;
          turn_type?: InterviewTurnType;
          primary_question_index?: number | null;
          audio_url?: string | null;
          created_at?: string;
          answered_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          turn_index?: number;
          question?: string;
          rationale?: string | null;
          answer_text?: string | null;
          transcript?: string | null;
          turn_type?: InterviewTurnType;
          primary_question_index?: number | null;
          audio_url?: string | null;
          created_at?: string;
          answered_at?: string | null;
        };
        Relationships: [];
      };
      media_analysis: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          turn_id: string | null;
          media_type: "video" | "audio";
          storage_path: string | null;
          consent_at: string;
          analysis: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          turn_id?: string | null;
          media_type?: "video" | "audio";
          storage_path?: string | null;
          consent_at: string;
          analysis?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          turn_id?: string | null;
          media_type?: "video" | "audio";
          storage_path?: string | null;
          consent_at?: string;
          analysis?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      peer_sessions: {
        Row: {
          id: string;
          host_user_id: string;
          partner_user_id: string | null;
          join_code: string;
          status: "open" | "active" | "completed" | "cancelled";
          mode: InterviewMode;
          target_role: string | null;
          host_session_id: string | null;
          partner_session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_user_id: string;
          partner_user_id?: string | null;
          join_code: string;
          status?: "open" | "active" | "completed" | "cancelled";
          mode?: InterviewMode;
          target_role?: string | null;
          host_session_id?: string | null;
          partner_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_user_id?: string;
          partner_user_id?: string | null;
          join_code?: string;
          status?: "open" | "active" | "completed" | "cancelled";
          mode?: InterviewMode;
          target_role?: string | null;
          host_session_id?: string | null;
          partner_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      peer_feedback: {
        Row: {
          id: string;
          peer_session_id: string;
          from_user_id: string;
          to_user_id: string;
          ratings: Json;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          peer_session_id: string;
          from_user_id: string;
          to_user_id: string;
          ratings: Json;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          peer_session_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          ratings?: Json;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      coach_threads: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      coach_messages: {
        Row: {
          id: string;
          thread_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      coach_memory: {
        Row: {
          id: string;
          user_id: string;
          memory_key: string;
          memory_value: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          memory_key: string;
          memory_value: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          memory_key?: string;
          memory_value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          brand_name: string | null;
          llm_daily_cap: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          brand_name?: string | null;
          llm_daily_cap?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          brand_name?: string | null;
          llm_daily_cap?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      org_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: OrgMemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role?: OrgMemberRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          role?: OrgMemberRole;
          created_at?: string;
        };
        Relationships: [];
      };
      cohorts: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cohort_members: {
        Row: {
          id: string;
          cohort_id: string;
          email: string;
          user_id: string | null;
          status: CohortMemberStatus;
          invited_at: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          cohort_id: string;
          email: string;
          user_id?: string | null;
          status?: CohortMemberStatus;
          invited_at?: string;
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          cohort_id?: string;
          email?: string;
          user_id?: string | null;
          status?: CohortMemberStatus;
          invited_at?: string;
          joined_at?: string | null;
        };
        Relationships: [];
      };
      org_analytics_snapshots: {
        Row: {
          id: string;
          org_id: string;
          cohort_id: string | null;
          snapshot_date: string;
          metrics: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          cohort_id?: string | null;
          snapshot_date?: string;
          metrics: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          cohort_id?: string | null;
          snapshot_date?: string;
          metrics?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      org_llm_usage: {
        Row: {
          org_id: string;
          usage_date: string;
          call_count: number;
        };
        Insert: {
          org_id: string;
          usage_date?: string;
          call_count?: number;
        };
        Update: {
          org_id?: string;
          usage_date?: string;
          call_count?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      link_pending_cohort_members: {
        Args: { p_user_id: string };
        Returns: number;
      };
      increment_org_llm_usage: {
        Args: { p_org_id: string };
        Returns: Json;
      };
    };
    Enums: {
      interview_mode: InterviewMode;
      interview_session_status: InterviewSessionStatus;
      interview_difficulty: InterviewDifficulty;
      interview_input_mode: InterviewInputMode;
      interview_turn_type: InterviewTurnType;
      practice_task_type: PracticeTaskType;
      practice_task_status: PracticeTaskStatus;
      org_member_role: OrgMemberRole;
      cohort_member_status: CohortMemberStatus;
      media_type: "video" | "audio";
      peer_session_status: "open" | "active" | "completed" | "cancelled";
    };
  };
}
