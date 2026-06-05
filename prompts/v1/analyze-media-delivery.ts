export function buildAnalyzeMediaDeliveryPrompt(params: {
  role: string;
  transcript: string;
  durationSeconds?: number;
}): string {
  return `You are an interview coach analyzing delivery and presence from a mock interview recording transcript.

Target role: ${params.role}
Recording duration (seconds): ${params.durationSeconds ?? "unknown"}

Transcript / spoken content:
${params.transcript.slice(0, 8000)}

Infer delivery quality (not visual video frames). Score 0-100 for:
- confidence_score: vocal confidence, assertiveness
- delivery_score: clarity, pacing, professionalism

Provide emotion_summary (1-2 sentences), filler_assessment (brief), and 3 recommendations.

Respond with ONLY valid JSON:
{
  "confidence_score": 0,
  "delivery_score": 0,
  "emotion_summary": "...",
  "filler_assessment": "...",
  "recommendations": ["...", "...", "..."]
}`;
}
