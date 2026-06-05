/** Curated roles for autocomplete (DB templates merged at runtime). */
export const STATIC_ROLE_SUGGESTIONS = [
  "Software Engineer",
  "Senior Software Engineer",
  "Staff Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Product Manager",
  "Associate Product Manager",
  "Senior Product Manager",
  "Technical Product Manager",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Engineering Manager",
  "HR / People Operations",
  "General Professional",
  "Solutions Architect",
  "QA Engineer",
  "UX Designer",
  "Business Analyst",
  "Consultant",
  "Investment Banking Analyst",
  "Marketing Manager",
] as const;

function matchScore(query: string, role: string): number {
  const q = query.toLowerCase();
  const r = role.toLowerCase();
  if (r === q) return 100;
  if (r.startsWith(q)) return 80;
  if (r.split(/\s+/).some((word) => word.startsWith(q))) return 60;
  if (r.includes(q)) return 40;
  return 0;
}

export function filterRoleSuggestions(
  query: string,
  extra: string[] = [],
  limit = 8
): string[] {
  const pool = [
    ...new Set([...STATIC_ROLE_SUGGESTIONS, ...extra].map((s) => s.trim()).filter(Boolean)),
  ];

  const q = query.trim();
  if (!q) {
    return pool.slice(0, limit);
  }

  return pool
    .map((role) => ({ role, score: matchScore(q, role) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.role.localeCompare(b.role))
    .slice(0, limit)
    .map((item) => item.role);
}
