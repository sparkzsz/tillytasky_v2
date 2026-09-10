# Welcome page, Sign Up, and Demo Mode

## What you get

A new welcome screen is the first thing anyone sees at `tillytasky.lovable.app`, with the jar logo, the TillyTasky name, a short value line, one big **Preview Demo** button, and quieter **Log In** / **Sign Up** links below it. Styling reuses the existing card, border, font, and color language from the login page.

- **Preview Demo** drops a visitor straight into a fully populated TillyTasky — no account, no email.
- **Log In** keeps working exactly as it does today.
- **Sign Up** is new: email, password, confirm password, optional display name.
- Signed-in people go to the real app; nobody is auto-forwarded into the app unless they are signed in or chose the demo.

## Pages

| Page | What it is |
| --- | --- |
| `/` | New welcome screen |
| `/login` | Existing login (unchanged behavior) |
| `/signup` | New account creation |
| `/app` | The authenticated TillyTasky (today's home page, moved here) |
| `/demo` | The same TillyTasky, running on sample data |

Signing in or signing up lands on `/app`. Signing out returns to `/`.

## Demo Mode

The demo is a separate world from real accounts. It never touches the database and never signs anyone in.

Sample data seeded on first entry: 5 categories (School, Recruiting, Exercise, Self-care, General) with distinct colors and a set order, plus roughly 30 tasks spread across the past two weeks, today, and the next few days — a mix of completed and open, some marked important, some with descriptions. That makes Today's count and record, the Overview calendar, and the Progress chart all look real immediately.

Inside the demo the visitor can add, edit, complete, delete, and bulk-move tasks, and create/rename/recolor/reorder/delete categories, with confetti, search, export, display name, and till color all working. Everything is saved in the browser, so a refresh keeps their changes.

A small "Demo Mode" pill sits in the header next to the theme button, with an **Exit Demo** action that clears the demo data and returns to the welcome page. Re-entering the demo later starts fresh from the sample data — stated on the pill's tooltip so it isn't surprising.

## Sign Up details

Uses the existing authentication setup — no schema change, and existing accounts are untouched. If the project requires email confirmation, the page says so plainly ("Check your email to confirm, then log in") instead of pretending the person is signed in. A display name entered at signup is saved to the account so the greeting works right away. New accounts have no categories yet, so they land on the existing category setup screen — which is already the intended first-run experience.

## Technical notes

- **Shared shell**: the body of `src/routes/index.tsx` moves into `src/components/AppShell.tsx`, parameterized by a data layer object (`tasks`, `categories`, `displayName`, `logo`, `demo?: { onExit }`). `src/routes/app.tsx` passes the Supabase-backed hooks (`useTasks`, `useCategories`, `useDisplayName`, `useLogoVariant`); `src/routes/demo.tsx` passes local equivalents. No changes to `TodayView`, `TaskTable`, `OverviewView`, `ProgressView`, `CategoryManager`, `SettingsDialog`, or the dialogs.
- **Demo data layer**: new `src/lib/demo.ts` exports `useDemoTasks()` and `useDemoCategories()` returning the exact same shapes as `useTasks()` / `useCategories()` (including `hydrated`, `names`, `atLimit`, `reorder`, `moveTasksToDate`), backed by `localStorage` keys `tillytasky.demo.tasks.v1`, `tillytasky.demo.categories.v1`, `tillytasky.demo.profile.v1`, plus seed constants. It also calls `registerCategoryColors` so chips/charts color correctly.
- **Mode detection**: mode is the route. `/app` renders a client-side gate — while `useAuth().loading` show the spinner, then redirect to `/login` if there is no session. `/demo` never reads auth. Demo state is keyed only under the demo localStorage namespace, so it can't mix with the per-user keys.
- **Routing**: `src/routes/index.tsx` becomes the welcome page; `login.tsx` gains a link to `/signup` and redirects to `/app` on success; new `signup.tsx` calls `supabase.auth.signUp` and saves `display_name` in user metadata. Each route gets its own `head()` title/description; `/login`, `/signup`, `/app`, `/demo` are `noindex`, `/` is indexable.
- **Untouched**: `src/lib/tally.ts` Supabase logic, `src/lib/categories.ts`, `src/lib/migrate-legacy-tasks.ts`, `src/lib/auth.tsx` (only additive `signUp`), database schema, and RLS policies.
- **Sign-out** in `AppShell` navigates to `/` instead of `/login`.
