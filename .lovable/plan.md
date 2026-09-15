# Add a completion sound on task done

## Goal
Play a soft chime sound every time a user completes a task, in both authenticated (`/app`) and demo (`/demo`) mode.

## Plan

1. **Audio asset**
   - Add the user’s chosen audio file to `public/sounds/complete.mp3` (or `.wav`).
   - If the user does not have a file ready, I’ll add a small generated/placeholder chime and note how to swap it.

2. **Play utility**
   - Create a small client-safe helper (`src/lib/sounds.ts`) that:
     - Loads `/sounds/complete.mp3` into an `HTMLAudioElement`.
     - Plays the sound on task completion.
     - Catches play errors (e.g. browser autoplay blocked before first interaction).
     - Respects the user’s system reduced-motion preference.

3. **Wire into completion**
   - Trigger the sound from the task completion toggle in both `AppShell` (Today tab) and `TaskTable` (Tasks tab), so completing a task anywhere plays the chime.
   - Avoid playing when a task is being unchecked or when a bulk operation completes many tasks at once (sound only on individual "complete" action).

4. **Demo mode support**
   - Use the same public asset and helper in `demo.tsx`, so demo users hear it too.

5. **Verification**
   - Build passes.
   - Browser check: complete a task in demo mode and confirm the chime plays (or at least that no console errors occur if autoplay is blocked).

## What I need from you
Please upload the soft chime file you’d like to use (MP3 or WAV, ideally under 1 MB and 1–2 seconds). If you don’t have one yet, I can use a placeholder and you can replace `public/sounds/complete.mp3` later.
