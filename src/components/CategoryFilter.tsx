import { CATEGORIES, CATEGORY_STYLE, type Category } from "@/lib/tally";
import { cn } from "@/lib/utils";

type Props = {
  active: Category | "all";
  onChange: (value: Category | "all") => void;
};

export function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "chip-outline px-3 py-1 text-sm",
          active === "all" ? "bg-foreground text-background" : "bg-transparent",
        )}
      >
        All
      </button>
      {CATEGORIES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "chip-outline px-3 py-1 text-sm",
            active === c ? CATEGORY_STYLE[c].chip : "bg-transparent",
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
