import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, CATEGORY_STYLE, type Category, type Task } from "@/lib/tally";
import { cn } from "@/lib/utils";

type Props = {
  task: Task | null;
  onClose: () => void;
  onSave: (id: string, patch: { title: string; category: Category; date: string }) => void;
};

export function EditTaskDialog({ task, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDate(task.date);
    setCategory(task.category);
  }, [task]);

  function save() {
    if (!task) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave(task.id, { title: trimmed, category, date: date || task.date });
    onClose();
  }

  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-2 border-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Edit task</DialogTitle>
          <DialogDescription>Change the title, date or category.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
            onClick={save}
            disabled={!title.trim()}
            className="border-2 border-foreground font-display"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
