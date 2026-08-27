import { categoryStyle, type Category } from "@/lib/tally";
import { cn } from "@/lib/utils";

type Props = {
  categories: Category[];
  active: Category | "all";
  onChange: (value: Category | "all") => void;
};

export function CategoryFilter({ categories, active, onChange }: Props) {
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
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "chip-outline px-3 py-1 text-sm",
            active === c ? categoryStyle(c).chip : "bg-transparent",
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
