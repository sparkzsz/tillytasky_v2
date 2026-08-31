import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogOut, Moon, Sun } from "lucide-react";

import { OverviewView } from "@/components/OverviewView";
import { ProgressView } from "@/components/ProgressView";
import { TaskTable } from "@/components/TaskTable";
import { TodayView } from "@/components/TodayView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryManager } from "@/components/CategoryManager";
import { useAuth } from "@/lib/auth";
import { useCategories } from "@/lib/categories";
import { SettingsDialog } from "@/components/SettingsDialog";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { toKey, useDisplayName, useLogoVariant, useTasks, useTheme } from "@/lib/tally";

const TITLE = "TillyTasky — Stack tasks in your till.";
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
  const { tasks, addTask, toggleTask, removeTask, updateTask, clearTasks } = useTasks();
  const { theme, toggleTheme } = useTheme();
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const cats = useCategories(session?.user.id);
  const { displayName, setDisplayName } = useDisplayName(session?.user.id);
  const { logo, setLogo, src: logoSrcUrl } = useLogoVariant(session?.user.id);
  const [tab, setTab] = useState("today");
  const [setupDone, setSetupDone] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const needsOnboarding = !cats.loading && !cats.error && cats.categories.length === 0 && !setupDone;

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (needsOnboarding) return;
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key !== "n" && key !== "t") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) ||
          el.closest("[role='dialog']"))
      )
        return;
      e.preventDefault();
      setShortcutOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [needsOnboarding]);

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/login", replace: true });
  }

  async function handleResetEverything() {
    clearTasks();
    for (const c of cats.categories) await cats.remove(c.id);
    cats.reorder([]);
    setSetupDone(false);
    setTab("today");
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
      {!needsOnboarding && (
        <header className="mb-6 flex items-stretch justify-between gap-4">
          <div className="flex flex-col justify-between">
            <h1 className="font-display text-4xl leading-none sm:text-5xl">TillyTasky</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {displayName
                ? `Hi, ${displayName}! Let's stack tasks in your till.`
                : "Stack tasks in your till."}
            </p>
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
            <SettingsDialog
              tasks={tasks}
              displayName={displayName}
              logo={logo}
              onLogoChange={setLogo}
              onDisplayNameChange={setDisplayName}
              onResetTasks={clearTasks}
              onResetEverything={handleResetEverything}
            />
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Log out"
              title="Log out"
              className="rounded-full border-2 border-foreground p-2.5 transition-colors hover:bg-muted"
            >
              <LogOut className="size-4" />
            </button>
            <img
              src={logoSrcUrl}
              alt="TillyTasky jar logo"
              className="h-full max-h-[104px] w-auto shrink-0 self-stretch object-contain object-right"
            />
          </div>
        </header>
      )}

      {needsOnboarding ? (
        <CategoryManager
          onboarding
          logoSrc={logoSrcUrl}
          onFinish={() => setSetupDone(true)}
          categories={cats.categories}
          loading={cats.loading}
          error={cats.error}
          atLimit={cats.atLimit}
          onCreate={cats.create}
          onUpdate={cats.update}
          onRemove={cats.remove}
        />
      ) : (
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 h-auto flex-wrap rounded-full border-2 border-foreground bg-card p-1">
          {[
            { value: "today", label: "Today" },
            { value: "tasks", label: "Tasks" },
            { value: "categories", label: "Categories" },
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
            categories={cats.names}
            onAdd={addTask}
            onToggle={toggleTask}
            onRemove={removeTask}
            onUpdate={updateTask}
          />
        </TabsContent>
        <TabsContent value="tasks">
          <TaskTable
            tasks={tasks}
            categories={cats.names}
            onAdd={addTask}
            onToggle={toggleTask}
            onRemove={removeTask}
            onUpdate={updateTask}
          />
        </TabsContent>
        <TabsContent value="overview">
          <OverviewView tasks={tasks} categories={cats.names} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoryManager
            categories={cats.categories}
            loading={cats.loading}
            error={cats.error}
            atLimit={cats.atLimit}
            onCreate={cats.create}
            onUpdate={cats.update}
            onRemove={cats.remove}
            onReorder={cats.reorder}
          />
        </TabsContent>
        <TabsContent value="progress">
          <ProgressView tasks={tasks} categories={cats.names} />
        </TabsContent>
      </Tabs>
      )}
    </main>
  );
}

