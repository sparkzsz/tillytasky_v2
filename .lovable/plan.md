# Important toggle + custom logo color

## 1. "Mark important? ❗️" becomes a switch
In both the New task and Edit task dialogs, the Yes/No chip pair is replaced by a single on/off switch (shadcn `Switch`) sitting on the same row as the label. Off means not important; on marks the task important. Behavior and the `❗️` prefix stay exactly as they are.

## 2. Logo color choice in Settings
A new "Logo color" section is added to the Settings menu, placed between "Display name" and "Export data". Four options — Default (blue), Peach, Pink, Purple — are shown as clickable thumbnails of the actual logo images, with the selected one outlined. Choosing an option updates the logo immediately:

- the logo in the hero (top right of the home page)
- the logo on the login page and the category onboarding screen

The choice is saved per user in the browser, like the display name and theme, so it persists across refreshes.

## Technical notes
- Add `useLogoVariant(userId)` to `src/lib/tally.ts` (localStorage key `tillytasky.logo.<userId>`) returning `{ logo, setLogo }` with variants `default | peach | pink | purple` mapped to `/tillytasky_logo_default.png`, `/tillytasky_logo_peach.png`, `/tillytasky_logo_pink.png`, `/tillytasky_logo_purple.png`. Default falls back to `default`.
- `src/routes/index.tsx`: call the hook, use the resolved src for the hero logo, and pass `logo` + `onLogoChange` into `SettingsDialog`.
- `src/components/SettingsDialog.tsx`: new section with a 4-up grid of image buttons between the display-name and export sections.
- `src/routes/login.tsx` keeps the default logo (no user session there); onboarding logo (in `CategoryManager`) uses the selected variant if that component already receives it, otherwise it gets a `logoSrc` prop from `index.tsx`.
- Switch: use `@/components/ui/switch` in `AddTaskDialog.tsx` and `EditTaskDialog.tsx`, keeping the existing `important` state and callbacks unchanged.
