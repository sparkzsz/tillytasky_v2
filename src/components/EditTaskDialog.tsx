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
import { Textarea } from "@/components/ui/textarea";
import { categoryStyle, type Category, type Task } from "@/lib/tally";
import { cn } from "@/lib/utils";

const MAX_DESCRIPTION = 100;

type Props = {
  categories: Category[];
  task: Task | null;
  onClose: () => void;
  onSave: (
    id: string,
    patch: {
      title: string;
      category: Category;
      date: string;
      description: string | null;
      important: boolean;
    },
  ) => void;
};

export function EditTaskDialog({ categories, task, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<Category>("");
  const [description, setDescription] = useState("");
  const [important, setImportant] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDate(task.date);
    setCategory(task.category);
    setDescription(task.description ?? "");
    setImportant(task.important === true);
  }, [task]);

  function save() {
    if (!task) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave(task.id, {
      title: trimmed,
      category: category || task.category,
      date: date || task.date,
      description: description.trim() ? description.trim().slice(0, MAX_DESCRIPTION) : null,
      important,
    });
    onClose();
  }


  const options = category && !categories.includes(category) ? [category, ...categories] : categories;

  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-2 border-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Edit task</DialogTitle>
          <DialogDescription className="sr-only">Edit this task</DialogDescription>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-description">Description</Label>
              <span className="text-xs text-muted-foreground">
                {description.length}/{MAX_DESCRIPTION}
              </span>
            </div>
            <Textarea
              id="edit-description"
              value={description}
              maxLength={MAX_DESCRIPTION}
              rows={3}
              placeholder="Add a short note (optional)"
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
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
              {options.map((c) => (
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
