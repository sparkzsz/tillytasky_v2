import { useEffect, useState } from "react";
import { Loader2, LogOut, Moon, Sun } from "lucide-react";

import { OverviewView } from "@/components/OverviewView";
import { ProgressView } from "@/components/ProgressView";
import { TaskTable } from "@/components/TaskTable";
import { TodayView } from "@/components/TodayView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryManager } from "@/components/CategoryManager";
import { SettingsDialog } from "@/components/SettingsDialog";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import type { UserCategory } from "@/lib/categories";
import { logoSrc, toKey, type Category, type LogoVariant, type Task } from "@/lib/tally";
import { useTheme } from "@/lib/tally";

export type TasksApi = {
  tasks: Task[];
  hydrated: boolean;
  addTask: (
    title: string,
    category: Category,
    date: string,
    description?: string | null,
    important?: boolean,
  ) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  updateTask: (
    id: string,
    patch: Partial<Pick<Task, "title" | "category" | "date" | "description" | "important">>,
  ) => void;
  clearTasks: () => void;
  moveTasksToDate: (ids: string[], date: string) => void;
};

export type CategoriesApi = {
  categories: UserCategory[];
  names: string[];
  loading: boolean;
  error: string | null;
  atLimit: boolean;
  create: (name: string, color?: string | null) => Promise<string | null>;
  update: (id: string, name: string, color?: string | null) => Promise<string | null>;
  remove: (id: string) => Promise<string | null>;
  reorder: (ids: string[]) => Promise<void> | void;
};

type Props = {
  tasksApi: TasksApi;
  cats: CategoriesApi;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  logo: LogoVariant;
  onLogoChange: (value: LogoVariant) => void;
  /** Demo Mode shows a badge and an "Exit demo" action instead of log out. */
  demo?: boolean;
  onExit: () => void;
};

/**
 * The whole TillyTasky application UI. It is data-source agnostic: the
 * authenticated route feeds it Supabase-backed hooks, the demo route feeds it
 * localStorage-backed ones.
 */
export function AppShell({
  tasksApi,
  cats,
  displayName,
  onDisplayNameChange,
  logo,
  onLogoChange,
  demo = false,
  onExit,
}: Props) {
  const { tasks, addTask, toggleTask, removeTask, updateTask, clearTasks, moveTasksToDate } =
    tasksApi;
  const { theme, toggleTheme } = useTheme();
  const logoSrcUrl = logoSrc(logo);
  const [tab, setTab] = useState("today");
  const [setupDone, setSetupDone] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const needsOnboarding =
    !cats.loading && !cats.error && cats.categories.length === 0 && !setupDone;

  useEffect(() => {
    if (needsOnboarding) return;
    const TABS: Record<string, string> = {
      t: "today",
      a: "tasks",
      c: "categories",
      o: "overview",
      p: "progress",
    };
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) ||
          el.closest("[role='dialog']"))
      )
        return;
      if (key === "n") {
        e.preventDefault();
        setShortcutOpen(true);
      } else if (key === "s") {
        e.preventDefault();
        setSettingsOpen(true);
      } else if (key === "d") {
        e.preventDefault();
        toggleTheme();
      } else if (TABS[key]) {
        e.preventDefault();
        setTab(TABS[key]!);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [needsOnboarding, toggleTheme]);

  async function handleResetEverything() {
    clearTasks();
    for (const c of cats.categories) await cats.remove(c.id);
    await cats.reorder([]);
    setSetupDone(false);
    setTab("today");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:py-12">
      {!needsOnboarding && (
        <header className="mb-6 flex items-stretch justify-between gap-4">
          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-4xl leading-none sm:text-5xl">TillyTasky</h1>
              {demo && (
                <span
                  title="Sample data saved in this browser. Leaving the demo resets it."
                  className="rounded-full border-2 border-foreground bg-card px-2.5 py-0.5 font-display text-[11px] uppercase tracking-wide"
                >
                  Demo Mode
                </span>
              )}
            </div>
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
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              tasks={tasks}
              displayName={displayName}
              logo={logo}
              onLogoChange={onLogoChange}
              onDisplayNameChange={onDisplayNameChange}
              onResetTasks={clearTasks}
              onResetEverything={handleResetEverything}
            />
            <button
              type="button"
              onClick={onExit}
              aria-label={demo ? "Exit demo" : "Log out"}
              title={demo ? "Exit demo" : "Log out"}
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

      {cats.loading && cats.categories.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : needsOnboarding ? (
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
              onMoveTasksToDate={moveTasksToDate}
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

      {!needsOnboarding && (
        <AddTaskDialog
          hideTrigger
          open={shortcutOpen}
          onOpenChange={setShortcutOpen}
          categories={cats.names}
          defaultDate={toKey(new Date())}
          onAdd={addTask}
        />
      )}
    </main>
  );
}
