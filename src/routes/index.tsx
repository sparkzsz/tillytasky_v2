import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogOut, Moon, Sun } from "lucide-react";

import logoAsset from "@/assets/tillytasky_logo_transparent.png.asset.json";
import { OverviewView } from "@/components/OverviewView";
import { ProgressView } from "@/components/ProgressView";
import { TaskTable } from "@/components/TaskTable";
import { TodayView } from "@/components/TodayView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useTasks, useTheme } from "@/lib/tally";

const TITLE = "TillyTasky — Stack tasks in your till";
const DESCRIPTION =
  "Tally how many tasks you finish each day, beat yesterday's record, and watch your progress climb with a confetti hit on every checkmark.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

function Index() {
  const { tasks, addTask, toggleTask, removeTask, updateTask } = useTasks();
  const { theme, toggleTheme } = useTheme();
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("today");

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/login", replace: true });
  }

  if (loading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-6 flex items-stretch justify-between gap-4">
        <div className="flex flex-col justify-between">
          <h1 className="font-display text-4xl leading-none sm:text-5xl">TillyTasky</h1>
          <p className="mt-2 text-sm text-muted-foreground">Stack tasks in your till</p>
        </div>
        <div className="flex items-start gap-3 self-stretch">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color mode"
            className="rounded-full border-2 border-foreground p-2.5 transition-colors hover:bg-muted"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <img
            src={logoAsset.url}
            alt="TillyTasky jar logo"
            className="h-full max-h-[104px] w-auto shrink-0 self-stretch object-contain object-right"
          />
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 h-auto flex-wrap rounded-full border-2 border-foreground bg-card p-1">
          {[
            { value: "today", label: "Today" },
            { value: "tasks", label: "Tasks" },
            { value: "overview", label: "Overview" },
            { value: "progress", label: "Progress" },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="rounded-full px-4 py-1.5 font-display text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="today">
          <TodayView
            tasks={tasks}
            onAdd={addTask}
            onToggle={toggleTask}
            onRemove={removeTask}
            onUpdate={updateTask}
          />
        </TabsContent>
        <TabsContent value="tasks">
          <TaskTable
            tasks={tasks}
            onAdd={addTask}
            onToggle={toggleTask}
            onRemove={removeTask}
            onUpdate={updateTask}
          />
        </TabsContent>
        <TabsContent value="overview">
          <OverviewView tasks={tasks} />
        </TabsContent>
        <TabsContent value="progress">
          <ProgressView tasks={tasks} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

