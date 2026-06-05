"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SkillsPayload = {
  items: string[];
  summary?: string;
  extracted_at?: string;
} | null;

export function ProfileResumeCard() {
  const [resumeText, setResumeText] = useState("");
  const [skills, setSkills] = useState<SkillsPayload>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSkills = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/profile/resume");
      const data = await res.json();
      if (res.ok) setSkills(data.skills ?? null);
    } catch {
      // ignore
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  async function handleExtract() {
    if (resumeText.trim().length < 50) {
      setError("Paste at least 50 characters of resume text.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/profile/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to extract skills");
        return;
      }

      setSkills(data.skills ?? null);
      setSuccess(data.message ?? "Skills saved.");
      setResumeText("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume & skills</CardTitle>
        <CardDescription>
          Optional — enriches your first interview question using extracted
          skills (Phase 6).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fetching ? (
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        ) : skills?.items?.length ? (
          <div className="space-y-2">
            {skills.summary ? (
              <p className="text-sm text-muted-foreground">{skills.summary}</p>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {skills.items.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
            {skills.extracted_at ? (
              <p className="text-xs text-muted-foreground">
                Updated {new Date(skills.extracted_at).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No skills on file. Paste resume text below to personalize PM and
            other interviews.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="resumePaste">Paste resume text</Label>
          <Textarea
            id="resumePaste"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste experience, projects, and skills from your resume…"
            rows={5}
            className="resize-y"
          />
        </div>

        <Button onClick={handleExtract} disabled={loading}>
          {loading ? "Extracting…" : "Extract skills"}
        </Button>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
        {success ? (
          <p className="text-sm text-muted-foreground">{success}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
