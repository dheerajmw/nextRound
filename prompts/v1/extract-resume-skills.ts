export function buildExtractResumeSkillsPrompt(resumeText: string): string {
  const trimmed = resumeText.trim().slice(0, 12000);

  return `You are a resume parser for interview preparation. Extract structured skills from the resume below.

Resume:
${trimmed}

Respond with ONLY valid JSON (no markdown):
{
  "summary": "One sentence professional summary",
  "skills": ["skill1", "skill2", "... up to 15 concise skill phrases"]
}

Focus on: technical skills, tools, domains, leadership themes, and measurable strengths relevant to interviews.`;
}
