# Clearer carry-over wording + daily random till color

## 1. "Move automatically" description

The helper text under the toggle becomes explicit about timing:

> Runs once a day, the first time you open TillyTasky. Resets at midnight, your local time.

Behavior is unchanged — it already tracks the day using your device's local date, so it becomes available again after midnight where you are.

## 2. "Randomize till color daily" toggle

New control inside the Advanced dropdown in Settings, above "Yesterday's tasks":

- **Randomize daily** switch. When on, the till picture is picked automatically each day from the existing Till color options, and stays the same all day. It changes at midnight, your local time.
- While it's on, the Till color section shows a short note that today's color is picked for you, and the picker stays visible with the day's color highlighted. Tapping any option turns the toggle off and keeps that color, so nothing gets stuck.
- Turning the toggle off restores the color that was saved before randomizing started.
- Remembered per person on the device (separately for Demo Mode), so it survives refresh.

## Technical notes

- `src/lib/tally.ts`: add `randomLogoFor(dateKey)` — deterministic index into `LOGO_OPTIONS` derived from the date key (same day-of-year style hash used by `greetingFor`), so no storage of "today's pick" is needed and it flips when the local date flips (`toKey(new Date())` is local). Add `useRandomLogo(storageKey)` returning `{ random, setRandom }` backed by localStorage (`tillytasky.logorandom.v1.<userId>`), mirroring `useCarryOver`.
- `src/components/AppShell.tsx`: new `randomLogoKey` prop; compute `effectiveLogo = random ? randomLogoFor(toKey(new Date())) : logo` and use it for `logoSrc` (hero + onboarding). Pass `randomLogo` / `onRandomLogoChange` and `effectiveLogo` into `SettingsDialog`; when the user clicks a swatch while random is on, call `onRandomLogoChange(false)` then `onLogoChange(value)`.
- `src/components/SettingsDialog.tsx`: new props for the random toggle; Advanced gains a switch row above "Yesterday's tasks"; Till color section gains the note; update the auto-carry-over helper copy.
- `src/routes/app.tsx` passes `${LOGO_RANDOM_KEY}.${session.user.id}`; `src/routes/demo.tsx` passes `DEMO_LOGO_RANDOM_KEY` added to `DEMO_KEYS` in `src/lib/demo.ts`.
- No database, schema, or task-model changes.
