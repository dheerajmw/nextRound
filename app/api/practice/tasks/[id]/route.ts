import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { getPracticeTaskForUser } from "@/lib/personalization/access";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  status: z.enum(["completed", "skipped", "pending"]),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const task = await getPracticeTaskForUser(id, auth.user.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updates = {
    status: parsed.data.status,
    completed_at:
      parsed.data.status === "completed"
        ? new Date().toISOString()
        : parsed.data.status === "pending"
          ? null
          : undefined,
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("practice_tasks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select(
      "id, plan_id, type, title, instructions, payload, status, due_at, completed_at, retry_session_id, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ task: data });
}
