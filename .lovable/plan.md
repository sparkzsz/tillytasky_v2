# Plan: Saved-state display name button

## Goal
Give clearer feedback in Settings when a display name is saved. After clicking Save, the button should read "Saved" and be disabled/grayed out until the user edits the name again, at which point it should switch back to "Save" and become clickable.

## Current state
- `src/components/SettingsDialog.tsx` has a local `name` state and a Save button that calls `onDisplayNameChange(name)`.
- `onDisplayNameChange` is provided by the parent (`src/routes/index.tsx`) and ultimately calls `useDisplayName().setDisplayName`, which persists to Supabase `user_metadata`.
- There is no tracking of whether the current input matches the last-saved value.

## Proposed changes

### 1. Track saved state in `SettingsDialog.tsx`
- Add a local `lastSavedName` state initialized from the incoming `displayName` prop when the dialog opens.
- After `onDisplayNameChange(name)` resolves, update `lastSavedName` to the trimmed/saved value.
- The Save button is disabled and shows "Saved" when `name.trim() === lastSavedName.trim()`.
- When the user types and the trimmed input no longer matches `lastSavedName`, the button reverts to "Save" and becomes enabled.
- Keep the existing 24-character max length and trim behavior.

### 2. Handle async save feedback
- Make the Save click handler async so it can wait for `onDisplayNameChange` to finish before marking `lastSavedName`.
- Optionally show a brief loading spinner on the button while saving, reusing the existing `busy` pattern or a local `savingName` flag to avoid blocking other Settings actions.

### 3. Edge cases
- If the dialog is reopened, reset `lastSavedName` to the current `displayName` prop so the button starts in the correct state.
- If saving fails, do not update `lastSavedName`; keep the button as "Save" and enabled so the user can retry.

## Files to modify
- `src/components/SettingsDialog.tsx`

## Out of scope
- No changes to `useDisplayName` Supabase persistence logic.
- No changes to export, reset, or till-color sections.
