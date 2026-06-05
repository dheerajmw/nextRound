"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateCohortForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orgs/${orgId}/cohorts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create cohort");
        return;
      }
      router.push(`/org/${orgId}/cohorts/${data.cohort.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2 min-w-[200px] flex-1">
        <Label htmlFor="cohortName">New cohort name</Label>
        <Input
          id="cohortName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Spring 2026 cohort"
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create cohort"}
      </Button>
      {error ? (
        <p className="w-full text-sm text-destructive">{error}</p>
      ) : null}
    </form>
  );
}
