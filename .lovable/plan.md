# TillyTasky: search by date, scrollable day list, Settings menu, record date

## 1. Tasks tab — search by date
The search bar keeps matching title, category and description, and also matches the task date. Typing `2026-08-21`, `08/21`, `Aug 21`, `august`, or `2026` finds tasks on those days by matching both the raw `YYYY-MM-DD` key and a formatted label like `Aug 21, 2026`. Placeholder updated to mention dates.

## 2. Overview tab — scrollable day list
In the day-detail popup, the task list gets a max height (about 60% of the viewport) with vertical scrolling, so days with many tasks (e.g. Aug 21, 2026) no longer overflow the window. Header and date stay fixed above the scrolling list.

## 3. Settings button
A gear button joins the light/dark toggle and log-out button in the hero, opening a Settings dialog with:

- **Display name** — text input (max ~24 chars), saved per user in the browser. When set, the hero subtitle reads `Hi, [NAME]! Let's stack tasks in your till.`; when blank it stays `Stack tasks in your till.`
- **Export data** — first pick a range: Day (today), Week (current week), Month (current month), or All tasks. Then pick a format: `.csv` or `.xlsx`. Columns in this exact order: `Done, Task, Category, Date`. `Done` exports as the text `Yes` / `No`. File name reflects the range, e.g. `tillytasky-tasks-month-2026-08.csv`.
- **Reset data** — choose what to clear: **Tasks only** or **Everything (tasks and categories)**. Either choice requires an explicit confirmation step showing exactly what will be deleted. Clearing everything also removes the saved category order and sends the user back to category onboarding.


## 4. Today tab — all-time record card
The record card's helper line shows the date the record was set, formatted `Aug 21, 2026`, instead of `Beat # to set a new one`. If today is already the record, it shows a "new record in progress" style line; if there are no completed tasks yet, it shows a neutral placeholder.

## Technical notes
- Search: extend the filter in `src/components/TaskTable.tsx` to test `t.date` and a `fromKey(t.date)` formatted string.
- Overview: add `max-h-[60vh] overflow-y-auto` to the list container in `OverviewView.tsx`.
- Settings: new `src/components/SettingsDialog.tsx`; display name persisted via a small `useDisplayName(userId)` hook in `src/lib/tally.ts` using localStorage (same storage approach as theme and category order).
- Export: CSV built by hand (quoted fields). XLSX via the `xlsx` (SheetJS) package added as a dependency, generated in the browser.
- Reset: add a `clearTasks()` action to `useTasks` in `src/lib/tally.ts`, wired from the Settings dialog through `src/routes/index.tsx`.
- Record date: use the existing `bestRecord(tasks)` `bestDate` value in `TodayView.tsx`, formatted with `toLocaleDateString` (`{ month: "short", day: "numeric", year: "numeric" }`).
