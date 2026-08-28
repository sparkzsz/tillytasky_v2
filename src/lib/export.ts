import { formatDay, toKey, type Task } from "./tally";

export type ExportRange = "day" | "week" | "month" | "all";
export type ExportFormat = "csv" | "xlsx";

const HEADERS = ["Done", "Task", "Category", "Date"] as const;

function startOfWeek(d: Date) {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - out.getDay());
  return out;
}

export function rangeLabel(range: ExportRange) {
  const now = new Date();
  if (range === "day") return formatDay(toKey(now));
  if (range === "week") {
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${formatDay(toKey(start))} – ${formatDay(toKey(end))}`;
  }
  if (range === "month")
    return now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return "All tasks";
}

export function filterByRange(tasks: Task[], range: ExportRange) {
  if (range === "all") return tasks;
  const now = new Date();
  if (range === "day") {
    const key = toKey(now);
    return tasks.filter((t) => t.date === key);
  }
  if (range === "month") {
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return tasks.filter((t) => t.date.startsWith(prefix));
  }
  const start = toKey(startOfWeek(now));
  const endDate = startOfWeek(now);
  endDate.setDate(endDate.getDate() + 6);
  const end = toKey(endDate);
  return tasks.filter((t) => t.date >= start && t.date <= end);
}

function rows(tasks: Task[]) {
  return [...tasks]
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
    .map((t) => [t.done ? "Yes" : "No", t.title, t.category, formatDay(t.date)]);
}

function fileName(range: ExportRange, ext: ExportFormat) {
  const now = new Date();
  const stamp =
    range === "month"
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      : toKey(now);
  return `tillytasky-tasks-${range}-${stamp}.${ext}`;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function exportTasks(tasks: Task[], range: ExportRange, format: ExportFormat) {
  const data = [HEADERS as unknown as string[], ...rows(filterByRange(tasks, range))];
  const name = fileName(range, format);

  if (format === "csv") {
    const csv = data.map((r) => r.map((c) => csvCell(String(c))).join(",")).join("\r\n");
    download(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }), name);
    return;
  }

  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet["!cols"] = [{ wch: 8 }, { wch: 40 }, { wch: 18 }, { wch: 14 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Tasks");
  const out = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  download(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    name,
  );
}
