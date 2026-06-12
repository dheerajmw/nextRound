import { InterviewRoom } from "@/components/interview/interview-room";
import { loadInterviewSessionDetail } from "@/lib/interview/session-detail";
import { createClient } from "@/lib/supabase/server";
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
      <InterviewRoom initial={detail} />
    </div>
  );
}
