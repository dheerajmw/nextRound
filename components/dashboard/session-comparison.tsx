import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { SessionTrendPoint } from "@/lib/readiness/types";
import { cn } from "@/lib/utils";

export function SessionComparison({
  sessions,
}: {
  sessions: SessionTrendPoint[];
}) {
  if (sessions.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Session</th>
            <th className="pb-2 pr-4 font-medium">Overall</th>
            <th className="pb-2 pr-4 font-medium">Comm.</th>
            <th className="pb-2 pr-4 font-medium">Structure</th>
            <th className="pb-2 pr-4 font-medium">Content</th>
            <th className="pb-2 pr-4 font-medium">Readiness</th>
            <th className="pb-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.session_id} className="border-b last:border-0">
              <td className="py-3 pr-4">
                <div className="font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(s.date).toLocaleDateString()}
                </div>
              </td>
              <td className="py-3 pr-4 tabular-nums">{s.scores.overall}</td>
              <td className="py-3 pr-4 tabular-nums">
                {s.scores.communication}
              </td>
              <td className="py-3 pr-4 tabular-nums">{s.scores.structure}</td>
              <td className="py-3 pr-4 tabular-nums">{s.scores.content}</td>
              <td className="py-3 pr-4 tabular-nums">{s.readiness_index}</td>
              <td className="py-3">
                <Link
                  href={`/interviews/${s.session_id}`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" })
                  )}
                >
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
