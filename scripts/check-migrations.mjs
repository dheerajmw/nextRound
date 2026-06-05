#!/usr/bin/env node
/**
 * Prints which migration files to run. Run: npm run check:migrations
 */
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

const dir = resolve(process.cwd(), "db/migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

console.log("Apply these in Supabase → SQL Editor (in order):\n");
for (const file of files) {
  const sql = readFileSync(resolve(dir, file), "utf8");
  const creates = [...sql.matchAll(/create table public\.(\w+)/gi)].map((m) => m[1]);
  const label = creates.length ? ` → tables: ${creates.join(", ")}` : "";
  console.log(`  ${file}${label}`);
}
console.log(
  "\nRequired first: 001_initial.sql (profiles + interview_sessions)."
);
console.log(
  "Mock interviews: run 001–005. Practice inbox: through 006. Full app: 001–009."
);
console.log(
  "\nSchema cache errors (e.g. interview_sessions) mean 001 was not applied yet."
);
