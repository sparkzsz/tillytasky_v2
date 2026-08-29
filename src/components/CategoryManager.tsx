import { useState } from "react";
import { Check, GripVertical, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

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
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR, categoryStyle, styleForHex } from "@/lib/tally";
import { cn } from "@/lib/utils";

const SUGGESTIONS = ["Exercise", "General", "Recruiting", "School", "Self-care"];

type Props = {
  categories: UserCategory[];
  loading: boolean;
  error: string | null;
  atLimit: boolean;
  onCreate: (name: string, color?: string | null) => Promise<string | null>;
  onUpdate: (id: string, name: string, color?: string | null) => Promise<string | null>;
  onRemove: (id: string) => Promise<string | null>;
  /** Reorders the category list used by Today, Tasks and Progress. */
  onReorder?: (ids: string[]) => void;
  /** Onboarding mode: login-page styling + Finish action instead of a plain list. */
  onboarding?: boolean;
  /** Logo image shown in onboarding. */
  logoSrc?: string;
  onFinish?: () => void;
};

function ColorPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category color">
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c.hex}
          type="button"
          role="radio"
          aria-checked={value.toLowerCase() === c.hex.toLowerCase()}
          aria-label={c.label}
          title={c.label}
          disabled={disabled}
          onClick={() => onChange(c.hex)}
          className={cn(
            "size-7 rounded-full border-2 transition-transform",
            c.dot,
            value.toLowerCase() === c.hex.toLowerCase()
              ? "scale-110 border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-card"
              : "border-foreground/40 hover:scale-105",
          )}
        />
      ))}
    </div>
  );
}

export function CategoryManager({
  categories,
  loading,
  error,
  atLimit,
  onCreate,
  onUpdate,
  onRemove,
  onReorder,
  onboarding = false,
  logoSrc,
  onFinish,
}: Props) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_CATEGORY_COLOR);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState(DEFAULT_CATEGORY_COLOR);
  const [confirming, setConfirming] = useState<UserCategory | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const canDrag = !!onReorder && categories.length > 1;

  /** Persists a new order with the category at `from` moved by `dir`. */
  function moveBy(from: number, dir: -1 | 1) {
    const to = from + dir;
    if (!onReorder || to < 0 || to >= categories.length) return;
    const ids = categories.map((c) => c.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved!);
    onReorder(ids);
  }

  function dropOn(targetId: string) {
    const source = dragId;
    setDragId(null);
    setOverId(null);
    if (!onReorder || !source || source === targetId) return;
    const ids = categories.map((c) => c.id);
    const from = ids.indexOf(source);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved!);
    onReorder(ids);
  }

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setMessage(null);
    const err = await fn();
    setBusy(false);
    if (err) setMessage(err);
    return err;
  }

  async function add(name = newName, color = newColor) {
    if (!name.trim()) return;
    const err = await run(() => onCreate(name, color));
    if (!err) {
      setNewName("");
      setNewColor(DEFAULT_CATEGORY_COLOR);
    }
  }

  async function saveEdit() {
    if (!editingId) return;
    const err = await run(() => onUpdate(editingId, editingName, editingColor));
    if (!err) setEditingId(null);
  }

  async function confirmDelete() {
    if (!confirming) return;
    const err = await run(() => onRemove(confirming.id));
    if (!err) setConfirming(null);
  }

  const taken = new Set(categories.map((c) => c.name.toLowerCase()));
  const remainingSuggestions = SUGGESTIONS.filter((s) => !taken.has(s.toLowerCase()));

  const panel = (
    <>
      {onboarding && (
        <div className="mb-6 flex items-center gap-3">
          <img
            src={logoSrc ?? "/tillytasky_logo_default.png"}
            alt="TillyTasky jar logo"
            className="h-16 w-auto object-contain"
          />
          <div>
            <h1 className="font-display text-3xl leading-none">TillyTasky</h1>
            <p className="mt-1 text-sm text-muted-foreground">Stack tasks in your till.</p>
          </div>
        </div>
      )}
      <div
        className={cn(
          onboarding ? "rounded-2xl border-2 border-foreground bg-card p-5 shadow-sm" : "card-pop p-5",
        )}
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className={cn("font-display", onboarding ? "text-xl" : "text-2xl")}>
              {onboarding ? "Set up your categories" : "Categories"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep your till organized. Group tasks by class, work, habit, and more.
              {!onboarding && " Drag the handles to set the order shown in Today, Tasks and Progress."}
            </p>
          </div>
          <span className="chip-outline px-3 py-1 text-sm">
            {categories.length} / {MAX_CATEGORIES} categories
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
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
          <ColorPicker value={newColor} onChange={setNewColor} disabled={atLimit || busy} />
        </div>

        {!atLimit && remainingSuggestions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Suggested</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {remainingSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => setNewName(s)}
                  className="chip-outline flex items-center gap-1.5 px-3 py-1 text-sm hover:bg-muted"
                >
                  <Plus className="size-3.5" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

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
        {categories.map((c, i) => (
          <div
            key={c.id}
            draggable={canDrag && editingId !== c.id}
            onDragStart={(e) => {
              setDragId(c.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDragOver={(e) => {
              if (!canDrag || !dragId || dragId === c.id) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOverId(c.id);
            }}
            onDragLeave={() => setOverId((prev) => (prev === c.id ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              dropOn(c.id);
            }}
            className={cn(
              "card-pop p-4 transition-opacity",
              dragId === c.id && "opacity-50",
              overId === c.id && dragId !== c.id && "ring-2 ring-foreground",
            )}
          >
            {editingId === c.id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
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
                </div>
                <ColorPicker value={editingColor} onChange={setEditingColor} disabled={busy} />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {canDrag && (
                  <button
                    type="button"
                    aria-label={`Reorder ${c.name}. Use arrow up or arrow down to move.`}
                    title="Drag to reorder"
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        moveBy(i, -1);
                      }
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        moveBy(i, 1);
                      }
                    }}
                    className="cursor-grab rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
                  >
                    <GripVertical className="size-4" />
                  </button>
                )}
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-semibold",
                    (styleForHex(c.color) ?? categoryStyle(c.name)).chip,
                  )}
                >
                  {c.name}
                </span>
                <span className="flex-1" />
                <button
                  type="button"
                  aria-label="Edit category"
                  onClick={() => {
                    setEditingId(c.id);
                    setEditingName(c.name);
                    setEditingColor(c.color ?? DEFAULT_CATEGORY_COLOR);
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
              </div>
            )}
          </div>
        ))}
      </div>

    </>
  );

  const body = onboarding ? (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      {panel}
    </main>
  ) : (
    <div className="space-y-6">{panel}</div>
  );

  return (
    <>
      {body}
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
    </>
  );
}
