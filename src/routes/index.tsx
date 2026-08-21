import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";

import { OverviewView } from "@/components/OverviewView";
import { ProgressView } from "@/components/ProgressView";
import { TaskTable } from "@/components/TaskTable";
import { TodayView } from "@/components/TodayView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [tab, setTab] = useState("today");

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-none sm:text-5xl">TillyTasky</h1>
          <p className="mt-2 text-sm text-muted-foreground">Stack tasks in your till</p>
        </div>
        <div className="flex items-start gap-3">
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
            className="h-[76px] w-[76px] shrink-0 object-contain sm:h-[88px] sm:w-[88px]"
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

