"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PeerMockPanel() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [peerSessionId, setPeerSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createRoom() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/peer/sessions", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      setCreatedCode(data.session.join_code);
      setPeerSessionId(data.session.id);
    } catch {
      setError("Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  async function joinRoom() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/peer/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ join_code: joinCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      setPeerSessionId(data.session.id);
      startInterview(data.session.id, data.session.target_role);
    } catch {
      setError("Failed to join");
    } finally {
      setLoading(false);
    }
  }

  async function startInterview(
    peerId: string,
    targetRole?: string | null
  ) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "behavioral",
          target_role: targetRole ?? "Software Engineer",
          peer_session_id: peerId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      router.push(`/interviews/${data.session.id}`);
    } catch {
      setError("Failed to start interview");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Host a peer mock</CardTitle>
          <CardDescription>
            Share the code with a partner; each completes a linked interview.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={createRoom} disabled={loading}>
            Create room
          </Button>
          {createdCode ? (
            <p className="text-lg font-mono font-semibold tracking-widest">
              {createdCode}
            </p>
          ) : null}
          {peerSessionId && createdCode ? (
            <Button
              variant="outline"
              onClick={() => startInterview(peerSessionId)}
              disabled={loading}
            >
              Start your interview
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Join with code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Join code</Label>
            <Input
              id="code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
            />
          </div>
          <Button onClick={joinRoom} disabled={loading || !joinCode.trim()}>
            Join & start
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-destructive md:col-span-2">{error}</p>
      ) : null}
    </div>
  );
}
