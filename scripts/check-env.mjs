#!/usr/bin/env node
/**
 * Validates .env.local for local dev. Run: npm run check:env
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");

if (!existsSync(envPath)) {
  console.error("Missing .env.local — run: cp .env.example .env.local");
  process.exit(1);
}

const raw = readFileSync(envPath, "utf8");
const vars = Object.fromEntries(
  raw
    .split("\n")
    .filter((line) => line && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const checks = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    ok: (v) =>
      v &&
      v.startsWith("https://") &&
      v.endsWith(".supabase.co") &&
      !v.includes("your-project") &&
      !v.includes("YOUR_PROJECT"),
    hint: "https://<project-ref>.supabase.co from Supabase → Settings → API",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ok: (v) => v && v.length > 20 && !v.includes("your-anon"),
    hint: "anon public key from Supabase → Settings → API",
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    ok: (v) => v && v.startsWith("http"),
    hint: "http://localhost:3000 for local dev",
  },
];

let failed = false;

for (const { key, ok, hint } of checks) {
  const value = vars[key];
  if (ok(value)) {
    console.log(`✓ ${key}`);
  } else {
    failed = true;
    console.error(`✗ ${key} — ${hint}`);
    if (value) console.error(`  current: ${value.slice(0, 48)}${value.length > 48 ? "…" : ""}`);
  }
}

if (failed) {
  console.error("\nEdit .env.local, then restart: npm run dev");
  process.exit(1);
}

console.log("\nEnv looks good. Restart dev server if you just changed .env.local.");
