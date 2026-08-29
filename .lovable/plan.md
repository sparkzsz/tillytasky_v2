# Suggestions for improving TillyTasky

Here are the highest-impact directions I see, grouped by theme. Each is a discrete upgrade that builds on what already exists.

## 1. Cross-device sync: move tasks from localStorage to Lovable Cloud
- Today tasks live in `localStorage`, but categories already live in Supabase under `public.categories`.
- Add a `public.tasks` table with RLS so each user sees only their own tasks.
- Replace `useTasks` with Supabase CRUD: real-time sync, multi-device access, and data survives browser resets.
- Keep export/import settings as-is.

## 2. Streaks & momentum
- Track consecutive days with at least one completed task.
- Add a "Current streak" and "Longest streak" card to the Today tab.
- Show a small flame/badge on calendar days that kept the streak alive.
- This reinforces the dopamine loop the app is built around.

## 3. Recurring tasks
- Let users mark a task as repeating: daily, weekdays, weekly, or monthly.
- On the scheduled day, the task auto-appears in Today (or is generated when the day loads).
- Store recurrence rules on the task row; editable from the Edit task dialog.

## 4. Goals & targets
- Add a daily completion target (e.g. "finish 5 tasks").
- Show progress toward the target in the Today header or on the record card.
- Optional weekly/monthly targets with a small progress ring.

## 5. Task priorities
- Add a priority level (Low / Medium / High) to tasks.
- Sort high-priority tasks to the top of Today and Tasks.
- Use a small colored dot or flag icon.

## 6. Subtasks / checklists
- Let a single task contain a short checklist (e.g. 3–5 sub-items).
- Parent task completion can be manual or auto-complete when all subtasks are done.
- Useful for bigger items like "Apply to 3 jobs" or "Study chapter 5".

## 7. Archive & soft-delete
- Instead of permanently deleting tasks, mark them as archived.
- Add an "Archived" filter in the Tasks tab so users can restore accidental deletes.
- Reset flows can then offer "Archive all" in addition to "Delete all".

## 8. Better Progress insights
- Add a "By day of week" breakdown (which days are most productive).
- Show category trends over time (a second chart in Progress).
- Highlight personal records and streak milestones.

## 9. Keyboard shortcuts & power-user features
- `n` to open the New task dialog.
- `?` to show a shortcuts sheet.
- `/` to focus the Tasks search.
- Bulk edit selected tasks (change date or category for many at once).

## 10. PWA / installable app
- Add a web manifest and service-worker scaffolding so TillyTasky can be installed on phones.
- Keep the offline-first localStorage fallback until tasks are moved to the cloud.

## Recommended first step
If you want one change that makes the app feel meaningfully more complete, **cross-device sync (#1)** is the strongest foundation: it makes the other features (streaks, recurring tasks, goals) more valuable because the data is durable and accessible everywhere.

If you prefer quicker wins, **streaks (#2)** or **daily goals (#4)** deepen the motivational loop without a big refactor.
