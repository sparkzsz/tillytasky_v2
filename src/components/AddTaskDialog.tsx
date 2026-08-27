import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { categoryStyle, type Category } from "@/lib/tally";
import { cn } from "@/lib/utils";

const MAX_DESCRIPTION = 100;

type Props = {
  categories: Category[];
  onAdd: (title: string, category: Category, date: string, description?: string | null) => void;
  defaultDate: string;
};

export function AddTaskDialog({ categories, onAdd, defaultDate }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>(categories[0] ?? "");

  useEffect(() => {
    if (!categories.includes(category)) setCategory(categories[0] ?? "");
  }, [categories, category]);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed || !category) return;
    onAdd(trimmed, category, date || defaultDate, description.trim() || null);
    setTitle("");
    setDescription("");
    setDate(defaultDate);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setDate(defaultDate);
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 border-2 border-foreground font-display shadow-[3px_3px_0_0_var(--color-foreground)]">
          <Plus className="size-4" /> Add task
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 border-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New task</DialogTitle>
          <DialogDescription>Add to your till…</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              id="task-title"
              autoFocus
              value={title}
              placeholder="e.g. Finish notes"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="task-description">Description</Label>
              <span className="text-xs text-muted-foreground">
                {description.length}/{MAX_DESCRIPTION}
              </span>
            </div>
            <Textarea
              id="task-description"
              value={description}
              maxLength={MAX_DESCRIPTION}
              rows={3}
              placeholder="Add a short note (optional)"
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-date">Date</Label>
            <Input
              id="task-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Create a category in the Categories tab first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "chip-outline px-3 py-1 text-sm",
                      category === c ? categoryStyle(c).chip : "bg-transparent",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={!title.trim() || !category}
            className="border-2 border-foreground font-display"
          >
            Add it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
