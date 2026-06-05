import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import {
  getLatestPathwayStep,
  listPracticeTasksForUser,
} from "@/lib/personalization/access";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const includeCompleted = url.searchParams.get("include_completed") === "1";

  try {
    const [tasks, pathway] = await Promise.all([
      listPracticeTasksForUser(auth.user.id, {
        includeCompleted,
        limit: 40,
      }),
      getLatestPathwayStep(auth.user.id),
    ]);

    return NextResponse.json({
      tasks,
      pathway_step: pathway.pathway_step,
      pathway_updated_at: pathway.plan_created_at,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load tasks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
