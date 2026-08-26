import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import logoAsset from "@/assets/tillytasky_logo_transparent.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

const TITLE = "Log in — TillyTasky";
const DESCRIPTION = "Log in to TillyTasky to keep stacking tasks in your till.";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { session, loading, configured, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(
        /invalid login credentials/i.test(signInError)
          ? "That email and password don't match an account."
          : signInError,
      );
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    void navigate({ to: "/", replace: true });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <img src={logoAsset.url} alt="TillyTasky jar logo" className="h-16 w-auto object-contain" />
        <div>
          <h1 className="font-display text-3xl leading-none">TillyTasky</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stack tasks in your till</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-sm"
      >
        <h2 className="font-display text-xl">Log in</h2>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back to your till.</p>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {!configured && (
          <p className="mt-4 rounded-lg border-2 border-foreground bg-muted p-3 text-sm">
            Login isn't configured in this environment yet. Set VITE_SUPABASE_URL and
            VITE_SUPABASE_ANON_KEY.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={submitting || !configured}
          className="mt-5 w-full rounded-full font-display"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Logging in…
            </>
          ) : (
            "Log In"
          )}
        </Button>
      </form>
    </main>
  );
}
