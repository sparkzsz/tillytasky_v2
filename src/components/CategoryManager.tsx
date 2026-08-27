import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

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
import { MAX_CATEGORIES, type UserCategory } from "@/lib/categories";
import { categoryStyle } from "@/lib/tally";
import { cn } from "@/lib/utils";

type Props = {
  categories: UserCategory[];
  loading: boolean;
  error: string | null;
  atLimit: boolean;
  onCreate: (name: string) => Promise<string | null>;
  onUpdate: (id: string, name: string) => Promise<string | null>;
  onRemove: (id: string) => Promise<string | null>;
  /** Onboarding mode: headline copy + Finish action instead of a plain list. */
  onboarding?: boolean;
  onFinish?: () => void;
};

export function CategoryManager({
  categories,
  loading,
  error,
  atLimit,
  onCreate,
  onUpdate,
  onRemove,
  onboarding = false,
  onFinish,
}: Props) {
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirming, setConfirming] = useState<UserCategory | null>(null);

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setMessage(null);
    const err = await fn();
    setBusy(false);
    if (err) setMessage(err);
    return err;
  }

  async function add() {
    if (!newName.trim()) return;
    const err = await run(() => onCreate(newName));
    if (!err) setNewName("");
  }

  async function saveEdit() {
    if (!editingId) return;
    const err = await run(() => onUpdate(editingId, editingName));
    if (!err) setEditingId(null);
  }

  async function confirmDelete() {
    if (!confirming) return;
    const err = await run(() => onRemove(confirming.id));
    if (!err) setConfirming(null);
  }

  return (
    <div className="space-y-6">
      <div className="card-pop p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl">
              {onboarding ? "Set up your categories" : "Your categories"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Categories keep your till organized — group tasks by class, work, or habit.
            </p>
          </div>
          <span className="chip-outline px-3 py-1 text-sm">
            {categories.length} / {MAX_CATEGORIES} categories
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Input
            value={newName}
            placeholder="e.g. School"
            disabled={atLimit || busy}
            maxLength={40}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void add();
            }}
            className="min-w-40 flex-1"
          />
          <Button
            onClick={() => void add()}
            disabled={atLimit || busy || !newName.trim()}
            className="gap-2 border-2 border-foreground font-display"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Add category
          </Button>
        </div>

        {atLimit && (
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;ve reached the {MAX_CATEGORIES}-category limit. Delete one to make room.
          </p>
        )}
        {(message || error) && (
          <p className="mt-2 text-sm font-semibold text-destructive">{message ?? error}</p>
        )}
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="card-pop flex items-center justify-center p-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && categories.length === 0 && (
          <div className="card-pop p-8 text-center">
            <p className="font-display text-xl">No categories yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first category above to get started.
            </p>
          </div>
        )}
        {categories.map((c) => (
          <div key={c.id} className="card-pop flex items-center gap-3 p-4">
            {editingId === c.id ? (
              <>
                <Input
                  autoFocus
                  value={editingName}
                  maxLength={40}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1"
                />
                <button
                  type="button"
                  aria-label="Save category"
                  onClick={() => void saveEdit()}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Check className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Cancel edit"
                  onClick={() => setEditingId(null)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </>
            ) : (
              <>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-semibold",
                    categoryStyle(c.name).chip,
                  )}
                >
                  {c.name}
                </span>
                <span className="flex-1" />
                <button
                  type="button"
                  aria-label="Rename category"
                  onClick={() => {
                    setEditingId(c.id);
                    setEditingName(c.name);
                  }}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Delete category"
                  onClick={() => setConfirming(c)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {onboarding && (
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={onFinish}
            disabled={categories.length === 0}
            className="border-2 border-foreground font-display"
          >
            Finish setup
          </Button>
        </div>
      )}

      <Dialog open={!!confirming} onOpenChange={(v) => !v && setConfirming(null)}>
        <DialogContent className="border-2 border-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Delete category?</DialogTitle>
            <DialogDescription>
              &ldquo;{confirming?.name}&rdquo; will be removed. Your tasks are kept — any task using
              it simply becomes uncategorized.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void confirmDelete()}
              className="border-2 border-foreground font-display"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
