"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function MediaAnalysisPanel({
  sessionId,
}: {
  sessionId: string;
}) {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    confidence_score: number;
    delivery_score: number;
    emotion_summary: string;
    recommendations: string[];
  } | null>(null);

  async function analyze() {
    if (!consent) {
      setError("Consent is required for media analysis.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/interviews/${sessionId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }
      setResult(data.analysis);
    } catch {
      setError("Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video / delivery analysis</CardTitle>
        <CardDescription>
          Analyzes confidence and delivery from your session transcript (Phase
          8+). No raw video is required for this MVP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            I consent to AI analysis of my interview delivery for coaching
            purposes.
          </span>
        </label>

        <Button onClick={analyze} disabled={loading || !consent}>
          {loading ? "Analyzing…" : "Analyze delivery"}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {result ? (
          <div className="space-y-2 text-sm border-t pt-4">
            <p>
              <Label>Confidence</Label> {result.confidence_score}/100 ·{" "}
              <Label>Delivery</Label> {result.delivery_score}/100
            </p>
            <p className="text-muted-foreground">{result.emotion_summary}</p>
            <ul className="list-disc pl-5">
              {result.recommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
