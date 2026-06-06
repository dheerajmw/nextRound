import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAppUrl, getServerEnv } from "@/lib/env";

export type LlmProvider = "gemini" | "openrouter";

export type CompletionResult = {
  provider: LlmProvider;
  text: string;
  model: string;
};

const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
/** OpenRouter retired gemma-2-9b-it:free; router picks any current free model. */
const DEFAULT_OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";

export async function completeWithGemini(
  prompt: string,
  model = DEFAULT_GEMINI_MODEL,
  maxOutputTokens = 256
): Promise<CompletionResult> {
  const { GEMINI_API_KEY } = getServerEnv();
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const generativeModel = genAI.getGenerativeModel({
    model,
    generationConfig: { maxOutputTokens },
  });
  const result = await generativeModel.generateContent(prompt);
  const text = result.response.text();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return { provider: "gemini", text: text.trim(), model };
}

export async function completeWithOpenRouter(
  prompt: string,
  model = DEFAULT_OPENROUTER_MODEL,
  maxTokens = 256
): Promise<CompletionResult> {
  const { OPENROUTER_API_KEY } = getServerEnv();
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getAppUrl(),
      "X-Title": "nextRound",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("OpenRouter returned an empty response");
  }

  return { provider: "openrouter", text, model };
}

export type CompleteWithFallbackOptions = {
  /** Enforces per-organization daily LLM cap (Phase 7). */
  userId?: string;
};

/** Primary Gemini with OpenRouter fallback (Phase 0 ping / future orchestration). */
export async function completeWithFallback(
  prompt: string,
  maxTokens = 256,
  options?: CompleteWithFallbackOptions
): Promise<CompletionResult> {
  if (options?.userId) {
    const { assertOrgLlmBudget } = await import("@/lib/partners/llm-cap");
    await assertOrgLlmBudget(options.userId);
  }

  const { GEMINI_API_KEY, OPENROUTER_API_KEY } = getServerEnv();

  if (GEMINI_API_KEY) {
    try {
      return await completeWithGemini(prompt, DEFAULT_GEMINI_MODEL, maxTokens);
    } catch (error) {
      if (!OPENROUTER_API_KEY) throw error;
      console.warn("[llm] Gemini failed, falling back to OpenRouter", error);
    }
  }

  if (OPENROUTER_API_KEY) {
    return completeWithOpenRouter(prompt, DEFAULT_OPENROUTER_MODEL, maxTokens);
  }

  throw new Error("No LLM API keys configured (GEMINI_API_KEY or OPENROUTER_API_KEY)");
}

export const LLM_PING_PROMPT =
  'Reply with exactly the single word "pong" and nothing else.';
