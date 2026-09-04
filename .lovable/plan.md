# Important tasks first in Today tab

## Goal
In the Today tab, list tasks so that important tasks appear first, then follow the user's category order, then sort alphabetically by task name.

## Plan
1. Update `sortTasksByCategory` in `src/lib/tally.ts`
   - Primary sort: important tasks before non-important tasks.
   - Secondary sort: the existing category-order ranking.
   - Tertiary sort: alphabetical by title (case-insensitive).
2. Verify `TodayView.tsx` continues to use `sortTasksByCategory` for today's filtered list; no other changes needed there.
3. Leave Tasks table, Overview, and Progress sorting unchanged per user choice.

## Files to change
- `src/lib/tally.ts` — modify the `sortTasksByCategory` helper.
