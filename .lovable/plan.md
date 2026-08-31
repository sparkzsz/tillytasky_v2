# Keyboard shortcuts + category order that follows you across devices

## 1. Keyboard shortcuts

"t" no longer opens the new-task dialog. New map (only when no dialog/input is focused):

- n — new task pop-up
- t — Today tab
- a — Tasks tab
- c — Categories tab
- o — Overview tab
- p — Progress tab
- s — open Settings
- d — toggle light/dark mode

Shortcuts stay inactive during onboarding and while typing in a field.

## 2. Category order syncs across devices

Today the custom order is saved in the browser that set it, so your phone falls back to alphabetical. The order will move into your database so every device shows the same order.

You'll run this SQL once in your Supabase SQL editor:

```sql
alter table public.categories add column sort_order integer;
```

After that: dragging in the Categories tab writes each category's position to `sort_order`; every device reads and sorts by it. Categories with no value yet fall to the end alphabetically. On first load, any order already saved locally on that device is pushed up once so you don't lose your desktop arrangement.

## Technical notes

- `src/routes/index.tsx`: rewrite the global key handler into a switch that calls `setTab(...)`, `setShortcutOpen(true)`, `toggleTheme()`, or opens Settings; keep the input/dialog guard.
- `src/components/SettingsDialog.tsx`: accept optional `open` / `onOpenChange` props so the "s" shortcut can control it (uncontrolled default preserved).
- `src/lib/categories.ts`: `normalize` reads `sort_order`; sorting uses `sort_order` then name; `reorder(ids)` issues per-row `update({ sort_order: i })` calls, then refreshes; keep the localStorage value only as a one-time seed (`localStorage` flag per user) and stop writing it afterwards.
