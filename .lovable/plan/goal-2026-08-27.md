Replace confetti with a single random emoji burst on task completion.

## Goal
When a user completes a task, show one random emoji from a curated pool bursting outward from the completed checkmark, then quickly fade it out.

## Details
- **Emoji pool**: 🎉 ⭐ 🔥 🚀 ✅ 🏆 ✨ (random one per completion)
- **Animation**: Burst outward from the checkmark, then fade out (~1 s total)
- **Trigger points**: TodayView task card checkmark and All Tasks table checkmark

## Changes
1. **`src/lib/tally.ts`**
   - Replace `fireConfetti` with a small `fireEmoji(x: number, y: number)` helper that picks a random emoji and renders it in a transient absolutely-positioned element.
   - Remove the canvas-confetti import/usage.

2. **`src/styles.css`**
   - Add a CSS keyframes animation (e.g. `emoji-burst`) that scales from small to large and fades out while translating outward.

3. **`src/components/TodayView.tsx` & `src/components/TaskTable.tsx`**
   - Update the toggle handlers to pass the checkmark button's bounding-client coordinates to the new `fireEmoji` helper instead of calling `fireConfetti`.

4. **Cleanup**
   - Remove the `canvas-confetti` and `@types/canvas-confetti` dependencies since they will no longer be used.

## Verification
- Build passes.
- Completing a task in both Today and All Tasks views shows a single random emoji bursting from the checkmark.
