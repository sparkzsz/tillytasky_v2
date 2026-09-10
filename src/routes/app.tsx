import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useCategories } from "@/lib/categories";
import { useDisplayName, useLogoVariant, useTasks } from "@/lib/tally";

const TITLE = "Your till — TillyTasky";
const DESCRIPTION = "Stack tasks in your till and beat yesterday's count.";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthenticatedApp,
});

function AuthenticatedApp() {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const tasksApi = useTasks();
  const cats = useCategories(session?.user.id);
  const { displayName, setDisplayName } = useDisplayName(session?.user.id);
  const { logo, setLogo } = useLogoVariant(session?.user.id);

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <AppShell
      tasksApi={tasksApi}
      cats={cats}
      displayName={displayName}
      onDisplayNameChange={(value) => void setDisplayName(value)}
      logo={logo}
      onLogoChange={setLogo}
      onExit={async () => {
        await signOut();
        void navigate({ to: "/", replace: true });
      }}
    />
  );
}
