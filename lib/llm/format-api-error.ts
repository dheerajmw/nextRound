import { formatJsonParseError } from "@/lib/interview/parse-json";
import {
  formatLlmUserError,
  LlmUnavailableError,
} from "@/lib/llm/client";

/** Prefer LLM provider messages; fall back to JSON parse hints for model output errors. */
export function formatLlmApiError(error: unknown): string {
  if (
    error instanceof LlmUnavailableError ||
    (error instanceof Error &&
      (error.message.includes("OpenRouter error") ||
        error.message.includes("GEMINI_API_KEY")))
  ) {
    return formatLlmUserError(error);
  }

  return formatJsonParseError(error);
}
