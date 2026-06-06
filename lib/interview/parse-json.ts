/** Strip common model prefaces that appear before JSON or plain-text replies. */
export function stripLlmPreface(raw: string): string {
  return raw
    .replace(/^(?:User Safety|Assistant|Model|Response):\s*[^\n]*\n?/gim, "")
    .trim();
}

function normalizeJsonQuotes(raw: string): string {
  return raw
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

/** Escape literal newlines/tabs that appear inside JSON string values. */
export function escapeNewlinesInJsonStrings(json: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      result += ch;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString && ch === "\n") {
      result += "\\n";
      continue;
    }

    if (inString && ch === "\r") {
      continue;
    }

    if (inString && ch === "\t") {
      result += "\\t";
      continue;
    }

    result += ch;
  }

  return result;
}

function removeTrailingCommas(json: string): string {
  return json.replace(/,\s*([}\]])/g, "$1");
}

function closeTruncatedJson(json: string): string {
  let result = json.trimEnd();
  if (result.endsWith("}") || result.endsWith("]")) {
    return result;
  }

  let inString = false;
  let escaped = false;
  for (const ch of result) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
    }
  }

  if (inString) {
    result += '"';
  }

  const opens = (result.match(/{/g) ?? []).length;
  const closes = (result.match(/}/g) ?? []).length;
  if (opens > closes) {
    result += "}".repeat(opens - closes);
  }

  return result;
}

function buildJsonCandidates(raw: string): string[] {
  const trimmed = stripLlmPreface(raw.trim());
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const extracted = fenced?.[1]?.trim() ?? trimmed;

  const start = extracted.indexOf("{");
  const end = extracted.lastIndexOf("}");
  const sliced =
    start !== -1 && end !== -1 && end > start
      ? extracted.slice(start, end + 1)
      : extracted;

  const variants = new Set<string>([
    sliced,
    extracted,
    trimmed,
    normalizeJsonQuotes(sliced),
    escapeNewlinesInJsonStrings(sliced),
    escapeNewlinesInJsonStrings(normalizeJsonQuotes(sliced)),
    removeTrailingCommas(escapeNewlinesInJsonStrings(sliced)),
    closeTruncatedJson(escapeNewlinesInJsonStrings(sliced)),
    closeTruncatedJson(
      removeTrailingCommas(escapeNewlinesInJsonStrings(normalizeJsonQuotes(sliced)))
    ),
  ]);

  return [...variants].filter(Boolean);
}

export function extractJsonObject(raw: string): string {
  const candidates = buildJsonCandidates(raw);
  return candidates[0] ?? raw.trim();
}

export function parseJsonObject<T>(
  raw: string,
  parse: (value: unknown) => T
): T {
  const candidates = buildJsonCandidates(raw);

  let lastError: unknown;
  for (const candidate of candidates) {
    if (!candidate.startsWith("{")) continue;
    try {
      return parse(JSON.parse(candidate));
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Model response did not include valid JSON");
}

export function formatJsonParseError(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.includes("Unexpected token") ||
      error.message.includes("Unterminated string") ||
      error.message.includes("valid JSON")
    ) {
      return "The AI returned a malformed response. Please try again.";
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
