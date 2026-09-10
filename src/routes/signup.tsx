import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

const TITLE = "Sign up — TillyTasky";
const DESCRIPTION = "Create a TillyTasky account and start stacking tasks in your till.";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { configured, signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error: signUpError, needsConfirmation } = await signUp(
      email.trim(),
      password,
      name.trim(),
    );
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    if (needsConfirmation) {
      setConfirmSent(true);
      return;
    }
    void navigate({ to: "/app", replace: true });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <img
          src="/tillytasky_logo_default.png"
          alt="TillyTasky jar logo"
          className="h-16 w-auto object-contain"
        />
        <div>
          <h1 className="font-display text-3xl leading-none">TillyTasky</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stack tasks in your till.</p>
        </div>
      </div>

      {confirmSent ? (
        <div className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-sm">
          <h2 className="font-display text-xl">Check your email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to {email.trim()}. Confirm it, then log in to open your
            till.
          </p>
          <Button asChild className="mt-5 w-full rounded-full font-display">
            <Link to="/login">Go to log in</Link>
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-sm"
        >
          <h2 className="font-display text-xl">Sign up</h2>
          <p className="mt-1 text-sm text-muted-foreground">Start your own till.</p>

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name (optional)</Label>
              <Input
                id="name"
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tilly"
              />
            </div>
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>

          {!configured && (
            <p className="mt-4 rounded-lg border-2 border-foreground bg-muted p-3 text-sm">
              Sign up isn't configured in this environment yet. Set VITE_SUPABASE_URL and
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
                <Loader2 className="mr-2 size-4 animate-spin" /> Creating your till…
              </>
            ) : (
              "Sign Up"
            )}
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium underline">
              Log in
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
