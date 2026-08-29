import { useEffect, useState } from "react";
import { Download, Loader2, Settings, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportTasks, rangeLabel, filterByRange, type ExportRange } from "@/lib/export";
import { LOGO_OPTIONS, type LogoVariant, type Task } from "@/lib/tally";
import { cn } from "@/lib/utils";

type Props = {
  tasks: Task[];
  displayName: string;
  logo: LogoVariant;
  onLogoChange: (value: LogoVariant) => void;
  onDisplayNameChange: (value: string) => void;
  onResetTasks: () => void;
  onResetEverything: () => Promise<void> | void;
};

const RANGES: { value: ExportRange; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All tasks" },
];

export function SettingsDialog({
  tasks,
  displayName,
  logo,
  onLogoChange,
  onDisplayNameChange,
  onResetTasks,
  onResetEverything,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(displayName);
  const [range, setRange] = useState<ExportRange>("month");
  const [confirm, setConfirm] = useState<"tasks" | "all" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(displayName);
      setConfirm(null);
    }
  }, [open, displayName]);

  const count = filterByRange(tasks, range).length;

  async function handleExport(format: "csv" | "xlsx") {
    setBusy(true);
    try {
      await exportTasks(tasks, range, format);
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm === "all") await onResetEverything();
      else onResetTasks();
      setConfirm(null);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Settings"
        title="Settings"
        className="rounded-full border-2 border-foreground p-2.5 transition-colors hover:bg-muted"
      >
        <Settings className="size-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Settings</DialogTitle>
            <DialogDescription>Personalize, export, or clear your till.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <section className="space-y-2">
              <Label htmlFor="display-name" className="font-display text-base">
                Display name
              </Label>
              <div className="flex gap-2">
                <Input
                  id="display-name"
                  value={name}
                  maxLength={24}
                  placeholder="Your name"
                  onChange={(e) => setName(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={() => onDisplayNameChange(name)}
                  className="border-2 border-foreground font-display"
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Personalize your till with a greeting shown at the top.
              </p>
            </section>

            <section className="space-y-3 border-t-2 border-border pt-5">
              <p className="font-display text-base">Logo color</p>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Logo color">
                {LOGO_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={logo === o.value}
                    onClick={() => onLogoChange(o.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors",
                      logo === o.value
                        ? "border-foreground bg-secondary"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <img src={o.src} alt={`${o.label} TillyTasky logo`} className="h-12 w-auto object-contain" />
                    <span className="text-xs">{o.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3 border-t-2 border-border pt-5">
              <p className="font-display text-base">Export data</p>
              <div className="space-y-2">
                <Label htmlFor="export-range" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Range
                </Label>
                <Select value={range} onValueChange={(v) => setRange(v as ExportRange)}>
                  <SelectTrigger id="export-range" className="border-2 border-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RANGES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {rangeLabel(range)} — {count} task{count === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void handleExport("csv")}
                  className="gap-2 border-2 border-foreground font-display"
                >
                  <Download className="size-4" /> .csv
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void handleExport("xlsx")}
                  className="gap-2 border-2 border-foreground font-display"
                >
                  <Download className="size-4" /> .xlsx
                </Button>
              </div>
            </section>

            <section className="space-y-3 border-t-2 border-border pt-5">
              <p className="font-display text-base">Reset data</p>
              {confirm === null ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirm("tasks")}
                    className="gap-2 border-2 border-foreground font-display"
                  >
                    <Trash2 className="size-4" /> Tasks only
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setConfirm("all")}
                    className="gap-2 border-2 border-foreground font-display"
                  >
                    <Trash2 className="size-4" /> Everything
                  </Button>
                </div>
              ) : (
                <div className={cn("rounded-lg border-2 border-foreground p-3", "bg-secondary")}>
                  <p className="text-sm font-semibold">
                    {confirm === "all"
                      ? `Delete all ${tasks.length} task${tasks.length === 1 ? "" : "s"} and every category?`
                      : `Delete all ${tasks.length} task${tasks.length === 1 ? "" : "s"}?`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {confirm === "all"
                      ? "Categories are removed too, so you'll start again from category setup. This can't be undone."
                      : "Your categories stay. This can't be undone."}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={busy}
                      onClick={() => void handleReset()}
                      className="gap-2 border-2 border-foreground font-display"
                    >
                      {busy && <Loader2 className="size-4 animate-spin" />} Yes, delete
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setConfirm(null)}
                      className="font-display"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
