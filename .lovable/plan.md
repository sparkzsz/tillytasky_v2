# Export date format, category-ordered Today list, important tasks, new color

## 1. Export dates as 2026-08-19
- In the CSV/XLSX export, the Date column uses the raw `YYYY-MM-DD` day key instead of "Aug 19, 2026".
- Column order stays Done, Task, Description, Category, Date.

## 2. Today tab sorted by category order, then task name
- Today's list is grouped in the exact category order set in the Categories tab (drag-and-drop order).
- Within each category, tasks are sorted alphabetically by title (case-insensitive).
- Tasks whose category no longer exists sort last, still alphabetically.

## 3. Mark a task important
- Tasks get an `important` flag (default off).
- Add task and Edit task dialogs both get a "Mark important?" question with a Yes/No toggle, placed directly after Category.
- Anywhere a task title is shown (Today, Tasks table, Overview day details) an important task reads `❗️ [task name]`.
- Duplicating a task carries the flag over; the export Task column includes the `❗️` prefix.

## 4. New category color
- Add `#A9AF94` as a pickable category color, positioned between `#F76F54` (Poppy) and `#EA5E86` (Fuchsia), with a matching light/dark-readable chip token.

## Technical notes
- `src/lib/tally.ts`: add `important: boolean` to `Task`; default it to `false` when loading legacy localStorage rows; accept it in `addTask` and `updateTask`; add a `sortTasksByCategory(tasks, categoryOrder)` helper; add the new palette entry (`sage`, `#A9AF94`).
- `src/styles.css`: add the `--sage` color variable plus its `bg-sage` utility alongside the existing palette tokens.
- `src/components/AddTaskDialog.tsx` / `EditTaskDialog.tsx`: add the toggle after the Category block and pass `important` through the add/save callbacks.
- `src/components/TodayView.tsx`: apply the new sort to the visible list; render the `❗️` prefix.
- `src/components/TaskTable.tsx` and `src/components/OverviewView.tsx`: render the `❗️` prefix; duplicate action copies `important`.
- `src/lib/export.ts`: use `t.date` directly for Date and prefix the Task cell when important.
- `src/routes/index.tsx`: pass the ordered category list into Today for sorting.
