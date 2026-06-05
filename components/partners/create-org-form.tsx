"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateOrgForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand_name: brandName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create organization");
        return;
      }
      router.push(`/org/${data.organization.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="orgName">Organization name</Label>
        <Input
          id="orgName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Apex Bootcamp"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="brandName">Brand name (optional)</Label>
        <Input
          id="brandName"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Shown to students"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create organization"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
