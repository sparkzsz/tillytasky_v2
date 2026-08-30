# Till color label + move selected tasks to a day

## 1. Settings label
In the Settings menu, the "Logo color" section heading becomes "Till color". Nothing else in that section changes (same four logo thumbnails and behavior).

## 2. Move selected tasks to a chosen day
In the Tasks tab, when one or more tasks are selected, the action row keeps "X selected" and Delete, and gains a "Move to day" button. Clicking it opens a small calendar popover; picking a day moves every selected task to that date, closes the popover, and clears the selection. The table re-sorts as usual for the new dates.

## Technical notes
- `src/components/SettingsDialog.tsx`: change the section text and the `aria-label` on the grid from "Logo color" to "Till color".
- `src/components/TaskTable.tsx`: add a `Popover` + `Calendar` (both already in `src/components/ui`) next to the Delete button, shown only when `selected.length > 0`. On select, call the existing `onUpdate(id, {...task, date: toKey(day)})` for each selected task (reusing each task's current title/category/description/important), then `setSelected([])`.
- No new props on `TaskTable` and no data-layer changes — `onUpdate` from `src/routes/index.tsx` already persists dates.
