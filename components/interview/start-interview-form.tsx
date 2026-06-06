"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TargetRoleCombobox } from "@/components/interview/target-role-combobox";
import { TtsVoicePicker } from "@/components/interview/tts-voice-picker";
import {
  DEFAULT_TARGET_ROLE,
  DIFFICULTY_LABELS,
  INPUT_MODE_LABELS,
  INTERVIEW_MODE_LABELS,
  QUESTIONS_PER_SESSION,
  type InterviewInputMode,
} from "@/lib/interview/constants";
import type { InterviewMode } from "@/lib/supabase/database.types";

const ALL_MODES: InterviewMode[] = [
  "behavioral",
  "hr",
  "pm",
  "technical",
];

const INPUT_MODES: InterviewInputMode[] = ["both", "voice", "text"];

const MODE_HINTS: Record<InterviewMode, string> = {
  behavioral: "STAR-style stories — ownership, teamwork, outcomes.",
  hr: "Culture, motivation, conflict, and fit.",
  pm: "Product sense, metrics, prioritization; curated question bank.",
  technical: "Problem-solving and system design for your target role.",
};

export function StartInterviewForm({
  defaultTargetRole,
  schemaReady = true,
}: {
  defaultTargetRole?: string | null;
  schemaReady?: boolean;
}) {
  const router = useRouter();
  const [targetRole, setTargetRole] = useState(
    defaultTargetRole?.trim() || DEFAULT_TARGET_ROLE
  );
  const [mode, setMode] = useState<InterviewMode>("behavioral");
  const [inputMode, setInputMode] = useState<InterviewInputMode>("both");
  const [adaptive, setAdaptive] = useState(true);
  const [companyId, setCompanyId] = useState<string>("");
  const [companies, setCompanies] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies ?? []))
      .catch(() => {});
  }, []);

  async function handleStart() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          target_role: targetRole.trim(),
          adaptive,
          input_mode: inputMode,
          company_profile_id: companyId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const hint =
          typeof data.hint === "string" ? `\n${data.hint}` : "";
        setError(`${data.error ?? "Failed to start interview"}${hint}`);
        return;
      }

      router.push(`/interviews/${data.session.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Start mock interview</CardTitle>
        <CardDescription>
          {QUESTIONS_PER_SESSION} questions · voice & adaptive · PM uses curated
          question bank
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <TargetRoleCombobox
          value={targetRole}
          onChange={setTargetRole}
        />

        {companies.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="company">Company simulation (optional)</Label>
            <select
              id="company"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">General / no company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Interview mode</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {ALL_MODES.map((m) => {
              const selected = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span className="font-medium">
                    {INTERVIEW_MODE_LABELS[m]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 text-xs leading-relaxed">
            <p className="font-medium text-foreground">About interview mode</p>
            <p className="mt-1 text-muted-foreground">
              Chooses question style. <span className="text-foreground">Target role</span>{" "}
              above is the job title — they work together.
            </p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {ALL_MODES.map((m) => (
                <li key={m}>
                  <span
                    className={
                      mode === m ? "font-medium text-primary" : "text-foreground"
                    }
                  >
                    {INTERVIEW_MODE_LABELS[m]}:
                  </span>{" "}
                  {MODE_HINTS[m]}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Answer input</Label>
          <div className="flex flex-wrap gap-2">
            {INPUT_MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setInputMode(m)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  inputMode === m
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                {INPUT_MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={adaptive}
            onChange={(e) => setAdaptive(e.target.checked)}
            className="rounded border-input"
          />
          Adaptive follow-ups (probe weak or vague answers)
        </label>

        {inputMode !== "text" ? (
          <TtsVoicePicker />
        ) : null}

        <p className="text-xs text-muted-foreground">
          Difficulty adjusts from your last few session scores (
          {Object.values(DIFFICULTY_LABELS).join(" / ")}).
        </p>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          className="w-full"
          disabled={loading || !schemaReady || !targetRole.trim()}
          onClick={handleStart}
        >
          {loading ? "Generating first question…" : "Begin interview"}
        </Button>
      </CardContent>
    </Card>
  );
}
