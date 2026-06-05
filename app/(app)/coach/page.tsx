import Link from "next/link";
import { CoachChatPanel } from "@/components/vision/coach-chat-panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Career coach" };

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
      >
        ← Home
      </Link>
      <CoachChatPanel />
    </div>
  );
}
