import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, CATEGORY_STYLE, type Category } from "@/lib/tally";
import { cn } from "@/lib/utils";

type Props = {
  onAdd: (title: string, category: Category) => void;
  dateLabel: string;
};

export function AddTaskDialog({ onAdd, dateLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, category);
    setTitle("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 border-2 border-foreground font-display shadow-[3px_3px_0_0_var(--color-foreground)]">
          <Plus className="size-4" /> Add task
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 border-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New task</DialogTitle>
          <DialogDescription>Adding to {dateLabel}. Every check counts.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">What are you knocking out?</Label>
            <Input
              id="task-title"
              autoFocus
              value={title}
              placeholder="e.g. Finish reading response"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "chip-outline px-3 py-1 text-sm",
                    category === c ? CATEGORY_STYLE[c].chip : "bg-transparent",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={!title.trim()}
            className="border-2 border-foreground font-display"
          >
            Add it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
