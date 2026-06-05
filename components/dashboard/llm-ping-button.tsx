"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type PingResult =
  | { ok: true; provider: string; model: string; message: string }
  | { ok: false; error: string; hint?: string };

export function LlmPingButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PingResult | null>(null);

  async function handlePing() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/llm/ping");
      const data = (await res.json()) as PingResult;
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePing}
        disabled={loading}
      >
        {loading ? "Pinging LLM…" : "Test LLM connection"}
      </Button>
      {result ? (
        <pre className="max-w-full overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
