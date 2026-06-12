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
const DEFAULT_OPENROUTER_MODEL = "openrouter/free";

export type CompleteWithFallbackOptions = {
  /** Enforces per-organization daily LLM cap (Phase 7). */
  userId?: string;
  /** Ask Gemini to return application/json (more reliable structured output). */
  jsonMode?: boolean;
};

function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
}

function summarizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function truncate(text: string, max = 240): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function isRateLimitError(error: unknown): boolean {
  const message = summarizeError(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("quota exceeded") ||
    message.includes("resource_exhausted")
  );
}

export class LlmUnavailableError extends Error {
  readonly statusCode: number;
  readonly userMessage: string;
  readonly providerErrors: string[];

  constructor(providerErrors: string[], statusCode = 503) {
    const userMessage = buildLlmUserMessage(providerErrors);
    super(userMessage);
    this.name = "LlmUnavailableError";
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.providerErrors = providerErrors;
  }
}

function buildLlmUserMessage(errors: string[]): string {
  const openRouterRateLimited = errors.some(
    (entry) =>
      entry.startsWith("OpenRouter:") && isRateLimitError({ message: entry })
  );
  const geminiFailed = errors.some((entry) => entry.startsWith("Gemini:"));

  if (openRouterRateLimited && geminiFailed) {
    return (
      "AI is temporarily unavailable. Gemini failed and OpenRouter's free daily limit " +
      "(50 requests/day) is exhausted. Add a valid GEMINI_API_KEY in Vercel environment " +
      "settings (recommended), or add credits at openrouter.ai/settings/credits."
    );
  }

  if (openRouterRateLimited) {
    return (
      "OpenRouter free daily limit reached (50 requests/day on free models). " +
      "Set GEMINI_API_KEY as your primary provider in Vercel, add credits on OpenRouter, " +
      "or try again after the limit resets."
    );
  }

  if (geminiFailed && errors.length === 1) {
    return `Gemini failed: ${errors[0].replace(/^Gemini:\s*/, "")}. Check GEMINI_API_KEY in your environment.`;
  }

  return `All AI providers failed: ${errors.join(" | ")}`;
}

export function formatLlmUserError(error: unknown): string {
  if (error instanceof LlmUnavailableError) {
    return error.userMessage;
  }

  const message = summarizeError(error);
  if (message.includes("OpenRouter error (429)")) {
    return buildLlmUserMessage([`OpenRouter: ${message}`]);
  }

  if (message.includes("GEMINI_API_KEY is not configured")) {
    return "GEMINI_API_KEY is not configured. Add it in Vercel environment settings.";
  }

  if (isRateLimitError(error)) {
    return buildLlmUserMessage([message]);
  }

  return message;
}

export function getLlmErrorStatus(error: unknown): number {
  if (error instanceof LlmUnavailableError) {
    return error.statusCode;
  }
  if (error instanceof Error && error.name === "OrgLlmCapExceededError") {
    return 429;
  }
  if (isRateLimitError(error)) {
    return 429;
  }
  return 502;
}

export async function completeWithGemini(
  prompt: string,
  model = getGeminiModel(),
  maxOutputTokens = 256,
  jsonMode = false
): Promise<CompletionResult> {
  const { GEMINI_API_KEY } = getServerEnv();
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const generativeModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
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
  model = getOpenRouterModel(),
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

/** Primary Gemini with OpenRouter fallback; surfaces actionable errors when both fail. */
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
  const jsonMode = options?.jsonMode ?? false;
  const errors: string[] = [];

  if (!GEMINI_API_KEY && !OPENROUTER_API_KEY) {
    throw new Error(
      "No LLM API keys configured (GEMINI_API_KEY or OPENROUTER_API_KEY)"
    );
  }

  if (GEMINI_API_KEY) {
    try {
      return await completeWithGemini(
        prompt,
        getGeminiModel(),
        maxTokens,
        jsonMode
      );
    } catch (error) {
      errors.push(`Gemini: ${truncate(summarizeError(error))}`);
      console.warn("[llm] Gemini failed", error);
    }
  }

  if (OPENROUTER_API_KEY) {
    try {
      return await completeWithOpenRouter(
        prompt,
        getOpenRouterModel(),
        maxTokens
      );
    } catch (error) {
      errors.push(`OpenRouter: ${truncate(summarizeError(error))}`);
      console.warn("[llm] OpenRouter failed", error);
    }
  }

  if (GEMINI_API_KEY && OPENROUTER_API_KEY) {
    try {
      return await completeWithGemini(
        prompt,
        getGeminiModel(),
        maxTokens,
        jsonMode
      );
    } catch (error) {
      errors.push(`Gemini (retry): ${truncate(summarizeError(error))}`);
      console.warn("[llm] Gemini retry failed", error);
    }
  }

  const statusCode = errors.some((entry) => isRateLimitError({ message: entry }))
    ? 429
    : 503;
  throw new LlmUnavailableError(errors, statusCode);
}

export const LLM_PING_PROMPT =
  'Reply with exactly the single word "pong" and nothing else.';
