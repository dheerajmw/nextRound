export function buildCoachChatPrompt(params: {
  targetRole: string;
  readinessIndex: number | null;
  sessionCount: number;
  memoryBullets: string[];
  history: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage: string;
}): string {
  const memory =
    params.memoryBullets.length > 0
      ? params.memoryBullets.map((m) => `- ${m}`).join("\n")
      : "None yet.";

  const historyText =
    params.history.length === 0
      ? "None"
      : params.history
          .slice(-8)
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n\n");

  return `You are a long-term AI career coach for interview preparation.

Candidate target role: ${params.targetRole}
Readiness index: ${params.readinessIndex ?? "not yet scored"}
Completed mock interviews: ${params.sessionCount}

Coach memory (persist across sessions):
${memory}

Recent conversation:
${historyText}

User message:
${params.userMessage}

Give actionable, encouraging coaching in 2-4 short paragraphs. Reference their readiness when relevant.

Respond with ONLY valid JSON:
{
  "reply": "...",
  "memory_updates": [
    { "key": "short_snake_key", "value": "one sentence fact to remember" }
  ]
}`;
}
