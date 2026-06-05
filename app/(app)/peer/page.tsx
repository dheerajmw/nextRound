import Link from "next/link";
import { PeerMockPanel } from "@/components/vision/peer-mock-panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Peer mock interviews" };

export default async function PeerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Peer mock interviews</h1>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← Home
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Create or join a room with a 6-character code. Each person completes their
        own linked mock interview, then exchange feedback.
      </p>
      <PeerMockPanel />
    </div>
  );
}
