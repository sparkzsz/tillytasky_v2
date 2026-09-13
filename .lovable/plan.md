# Randomized greeting + Advanced settings

## 1. Greeting varies by day

The hero greeting picks one of three openers, chosen from the date so it stays the same all day and changes tomorrow:

- Hi [NAME]! Let's stack tasks in your till.
- Hello [NAME]! Let's stack tasks in your till.
- Hey [NAME]! Let's stack tasks in your till.

When no display name is set, the line stays "Stack tasks in your till." as today.

## 2. "Advanced" dropdown in Settings

- New collapsible section at the bottom of Settings, labeled "Advanced", collapsed every time Settings opens.
- The existing "Reset data" controls (Tasks only / Everything, with their confirmation step) move inside it, unchanged in behavior.

## 3. Carry yesterday's tasks to today

Also inside Advanced:

- **Move now** button: takes yesterday's unfinished tasks and re-dates them to today, in one action. Completed tasks stay where they are so history and records are untouched. Shows how many tasks moved, or says there were none.
- **Move automatically** toggle: when on, the same carry-over runs once per day the first time the app opens that day.

The toggle is remembered per person on the device (and separately for Demo Mode), so it keeps working after refresh.

## Technical notes

- `src/lib/tally.ts`: add a `greetingFor(date, name)` helper (index = day-of-year modulo 3) used by `AppShell`; add a `useCarryOver(userId)` hook storing the toggle plus a last-run date key in localStorage (`tillytasky.carryover.v1.<userId>`), mirroring the existing `useLogoVariant` pattern.
- Carry-over logic is a shared pure helper: given tasks, yesterday's key and today's key, return the ids of unfinished tasks dated yesterday; both modes then call the existing `moveTasksToDate(ids, today)` — one date-only update, no category writes.
- `src/lib/demo.ts`: same toggle stored under `tillytasky.demo.carryover.v1`, using the demo `moveTasksToDate`.
- `src/components/SettingsDialog.tsx`: wrap reset controls and the new carry-over controls in a shadcn Collapsible defaulting to closed (reset on open, like the existing confirm reset). New props for the toggle value/setter and a `onCarryOverNow` handler.
- `src/components/AppShell.tsx`: use the greeting helper; run the automatic carry-over in an effect once tasks are hydrated and the stored last-run date is before today; pass new props to `SettingsDialog`.
- No database schema, RLS, or task-model changes.
