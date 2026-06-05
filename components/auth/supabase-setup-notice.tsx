import {
  isSupabaseConfigured,
  supabaseConfigError,
} from "@/lib/auth/format-auth-error";

export function SupabaseSetupNotice() {
  if (isSupabaseConfigured()) {
    return null;
  }

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
