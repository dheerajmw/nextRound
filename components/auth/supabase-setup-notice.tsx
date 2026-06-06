import {
  isSupabaseConfigured,
  supabaseConfigError,
} from "@/lib/auth/format-auth-error";
import { verifySupabaseConnection } from "@/lib/supabase/verify-connection";

export async function SupabaseSetupNotice() {
  if (!isSupabaseConfigured()) {
    return (
      <div
        className="mb-6 w-full max-w-md rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
        role="status"
      >
        <p className="font-medium text-amber-200">Local setup required</p>
        <p className="mt-2 text-muted-foreground">{supabaseConfigError()}</p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-black/30 p-3 font-mono text-xs text-muted-foreground">
          {`# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000`}
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">
          Then run <code className="text-primary">npm run check:env</code> and restart{" "}
          <code className="text-primary">npm run dev</code>.
        </p>
      </div>
    );
  }

  const status = await verifySupabaseConnection();
  if (status.ok) {
    return null;
  }

  return (
    <div
      className="mb-6 w-full max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground"
      role="alert"
    >
      <p className="font-medium text-destructive">Supabase connection problem</p>
      <p className="mt-2 text-muted-foreground">{status.message}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Run <code className="text-primary">npm run check:env</code>, fix{" "}
        <code className="text-primary">.env.local</code>, then restart{" "}
        <code className="text-primary">npm run dev</code>. On Vercel, redeploy after
        updating env vars.
      </p>
    </div>
  );
}
