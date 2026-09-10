import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { clearDemoData, useDemoCategories, useDemoProfile, useDemoTasks } from "@/lib/demo";

const TITLE = "Demo — TillyTasky";
const DESCRIPTION = "Explore TillyTasky with sample tasks, no account needed.";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: DemoApp,
});

function DemoApp() {
  const navigate = useNavigate();
  const tasksApi = useDemoTasks();
  const cats = useDemoCategories();
  const { displayName, setDisplayName, logo, setLogo } = useDemoProfile();

  return (
    <AppShell
      demo
      tasksApi={tasksApi}
      cats={cats}
      displayName={displayName}
      onDisplayNameChange={setDisplayName}
      logo={logo}
      onLogoChange={setLogo}
      onExit={() => {
        clearDemoData();
        void navigate({ to: "/", replace: true });
      }}
    />
  );
}
