/** Strip common model prefaces that appear before JSON or plain-text replies. */
export function stripLlmPreface(raw: string): string {
  return raw
    .replace(/^(?:User Safety|Assistant|Model|Response):\s*[^\n]*\n?/gim, "")
    .trim();
}

export function extractJsonObject(raw: string): string {
  const trimmed = stripLlmPreface(raw.trim());
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

export function parseJsonObject<T>(
  raw: string,
  parse: (value: unknown) => T
): T {
  const candidates = [
    extractJsonObject(raw),
    stripLlmPreface(raw.trim()),
  ];

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
