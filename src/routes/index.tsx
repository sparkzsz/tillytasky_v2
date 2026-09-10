import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, LineChart, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

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
  component: WelcomePage,
});

const HIGHLIGHTS = [
  { icon: Sparkles, label: "Confetti on every checkmark" },
  { icon: CalendarDays, label: "Calendar of everything you finished" },
  { icon: LineChart, label: "Progress that beats yesterday" },
];

function WelcomePage() {
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

      <div className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-sm">
        <h2 className="font-display text-xl">Count what you get done</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop every finished task into your till, watch the day's count climb, and try to beat
          yesterday's record.
        </p>

        <ul className="mt-4 space-y-2">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5 text-sm">
              <span className="rounded-full border-2 border-foreground bg-background p-1.5">
                <Icon className="size-3.5" />
              </span>
              {label}
            </li>
          ))}
        </ul>

        <Button asChild className="mt-5 w-full rounded-full font-display">
          <Link to="/demo">Preview Demo</Link>
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          No account needed — explore a till that's already full.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button asChild variant="outline" className="rounded-full font-display">
            <Link to="/login">Log In</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full font-display">
            <Link to="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
