import { FILLER_PATTERNS } from "@/lib/evaluation/constants";

export function countFillerWords(text: string): number {
  let total = 0;
  for (const pattern of FILLER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) total += matches.length;
  }
  return total;
}
