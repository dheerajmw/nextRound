import Link from "next/link";
import { CreateOrgForm } from "@/components/partners/create-org-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export const metadata = { title: "Organizations" };

export default async function OrgListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id);

  const orgIds = (memberships ?? []).map((m) => m.org_id);
  const { data: orgs } =
    orgIds.length > 0
      ? await supabase
          .from("organizations")
          .select("id, name, slug, brand_name")
          .in("id", orgIds)
      : { data: [] };

  const roleByOrg = new Map(
    (memberships ?? []).map((m) => [m.org_id, m.role])
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Partner organizations</h1>
          <p className="text-muted-foreground text-sm">
            Placement cells, bootcamps, and coaches
          </p>
        </div>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← Dashboard
        </Link>
      </div>

      {(orgs ?? []).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(orgs ?? []).map((org) => (
                <li key={org.id}>
                  <Link
                    href={`/org/${org.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {org.brand_name ?? org.name}
                  </Link>
                  <span className="ml-2 text-xs text-muted-foreground capitalize">
                    {roleByOrg.get(org.id)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Create organization</CardTitle>
          <CardDescription>
            You become the admin. Create cohorts and invite students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrgForm />
        </CardContent>
      </Card>
    </div>
  );
}
