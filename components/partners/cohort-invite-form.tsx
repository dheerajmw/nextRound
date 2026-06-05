"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CohortInviteForm({
  orgId,
  cohortId,
}: {
  orgId: string;
  cohortId: string;
}) {
  const router = useRouter();
  const [emails, setEmails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    const list = emails
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (list.length === 0) {
      setError("Enter at least one email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/orgs/${orgId}/cohorts/${cohortId}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: list }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invite failed");
        return;
      }
      setEmails("");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="emails">Invite students (emails)</Label>
      <Textarea
        id="emails"
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        placeholder="one@school.edu, two@school.edu&#10;or one per line"
        rows={4}
      />
      <Button onClick={handleInvite} disabled={loading}>
        {loading ? "Sending…" : "Send invites"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
