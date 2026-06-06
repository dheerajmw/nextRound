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
    ok: (v) =>
      v &&
      v.length > 20 &&
      !v.includes("your-anon") &&
      !v.includes("placeholder-anon-key") &&
      (v.startsWith("eyJ") ||
        v.startsWith("sb_publishable_") ||
        v.startsWith("sb_secret_")),
    hint:
      "Publishable key (sb_publishable_…) or Legacy anon JWT (eyJ…) from Supabase → Settings → API",
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
    if (value) {
      console.error(
        `  current: ${value.slice(0, 48)}${value.length > 48 ? "…" : ""}`
      );
    }
  }
}

async function verifySupabaseKey() {
  const url = vars.NEXT_PUBLIC_SUPABASE_URL;
  const key = vars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const body = await res.text();
    if (res.ok) {
      console.log("✓ Supabase API key accepted (auth health check)");
      return;
    }
    failed = true;
    console.error(`✗ Supabase rejected your API key (HTTP ${res.status})`);
    if (body.toLowerCase().includes("invalid api key")) {
      console.error(
        "  Copy Publishable or Legacy anon key from the SAME project as your URL."
      );
    } else {
      console.error(`  ${body.slice(0, 120)}`);
    }
  } catch (error) {
    failed = true;
    console.error(
      `✗ Could not reach Supabase: ${error instanceof Error ? error.message : error}`
    );
  }
}

await verifySupabaseKey();

if (failed) {
  console.error("\nEdit .env.local, then restart: npm run dev");
  console.error(
    "On Vercel: set the same vars → Deployments → Redeploy (required for NEXT_PUBLIC_*)."
  );
  process.exit(1);
}

console.log("\nEnv looks good. Restart dev server if you just changed .env.local.");
