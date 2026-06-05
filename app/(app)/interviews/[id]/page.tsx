import Link from "next/link";
import { InterviewRoom } from "@/components/interview/interview-room";
import { buttonVariants } from "@/components/ui/button";
import { loadInterviewSessionDetail } from "@/lib/interview/session-detail";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { redirect, notFound } from "next/navigation";

export const metadata = {
  title: "Interview",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InterviewPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const detail = await loadInterviewSessionDetail(id, user.id, {
    runEvaluationIfMissing: true,
  });

  if (!detail) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-4 inline-flex"
          )}
        >
          ← Dashboard
        </Link>
      </div>

      <InterviewRoom initial={detail} />
    </div>
  );
}
