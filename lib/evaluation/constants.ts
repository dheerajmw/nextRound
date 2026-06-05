export const EVALUATION_PROMPT_VERSION = "v1";

/** Common filler words/phrases for text heuristic (Phase 2). */
export const FILLER_PATTERNS = [
  /\bum\b/gi,
  /\buh\b/gi,
  /\blike\b/gi,
  /\byou know\b/gi,
  /\bbasically\b/gi,
  /\bactually\b/gi,
  /\bkind of\b/gi,
  /\bsort of\b/gi,
  /\bi mean\b/gi,
  /\bso yeah\b/gi,
] as const;
