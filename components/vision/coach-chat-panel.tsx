"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Message = { role: string; content: string };

export function CoachChatPanel() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThread = useCallback(async () => {
    const res = await fetch("/api/coach");
    const data = await res.json();
    if (res.ok) {
      setThreadId(data.thread_id);
      setMessages(data.messages ?? []);
    }
  }, []);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  async function send() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          thread_id: threadId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      setInput("");
      setThreadId(data.threadId);
      await loadThread();
    } catch {
      setError("Failed to send");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col h-[min(70vh,600px)]">
      <CardHeader>
        <CardTitle>AI career coach</CardTitle>
        <CardDescription>
          Long-horizon coaching with memory from your interview history.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 min-h-0">
        <div className="flex-1 overflow-y-auto space-y-3 rounded-lg border p-3 bg-muted/20">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask about interview strategy, role fit, or your readiness trends.
            </p>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm ${
                  m.role === "user" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="font-medium capitalize">{m.role}: </span>
                {m.content}
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach…"
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button onClick={send} disabled={loading}>
            Send
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
