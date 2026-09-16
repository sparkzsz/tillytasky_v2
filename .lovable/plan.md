# Auto-hide completed tasks toggle

## What changes

- A new **Auto-hide completed** switch in Settings, placed directly after the **Till color** section.
- Default is **off** — today's list looks exactly as it does now unless the user turns it on.
- When on, tasks marked complete disappear from the **Today** tab list. The counters at the top (Today's Till, Yesterday, All-time record) are unchanged, so the tally still counts hidden completions.
- When off, completed tasks show as they do today (dimmed with a strikethrough).
- Applies to the Today tab only; the Tasks, Categories, Overview, and Progress views are untouched.
- Remembered per person on the device (separately for Demo Mode), so it survives refresh — same pattern as the "Randomize daily" and carry-over preferences.

## Technical notes

- `src/lib/tally.ts`: add `HIDE_DONE_KEY = "tillytasky.hidedone.v1"` and a `useHideDone(storageKey)` hook returning `{ hideDone, setHideDone }` backed by localStorage, mirroring `useRandomLogo`.
- `src/components/AppShell.tsx`: new `hideDoneKey` prop; read the preference and pass `hideDone` / `onHideDoneChange` into both `SettingsDialog` and `TodayView`.
- `src/components/SettingsDialog.tsx`: new switch row right after Till color with helper copy, e.g. "Completed tasks disappear from your Today list. Your counts and records are unchanged."
- `src/components/TodayView.tsx`: new optional `hideDone` prop; when true, filter `visible` to exclude `task.done` (filtering only — data is never deleted). Empty-state copy stays as is.
- `src/routes/app.tsx` passes `${HIDE_DONE_KEY}.${session.user.id}`; `src/routes/demo.tsx` passes `DEMO_HIDE_DONE_KEY` added to `DEMO_KEYS` in `src/lib/demo.ts`.
- No database, schema, or task-model changes.
