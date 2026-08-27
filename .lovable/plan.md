# Descriptions on new tasks + drag-and-drop category order

## 1. Description when creating a task
- Add an optional description field (textarea + live counter) to the "New task" pop-up, matching the edit dialog's look.
- Limit: 100 characters.
- The new task saves with its description instead of always starting empty.

## 2. Edit task description limit
- Lower the existing edit-dialog description cap from 200 to 100 characters (counter and input both).
- Descriptions already longer than 100 characters stay readable; they get trimmed to 100 on the next save.

## 3. Drag-and-drop category ordering
- Replace the up/down arrow buttons in the Categories tab with a drag handle on each row.
- Drag a category to a new position; the list reorders on drop and the new order saves immediately (per user, same storage as today).
- Order continues to drive Today, Tasks, and Progress.
- Keyboard accessible: the handle can be focused and moved with arrow keys so ordering still works without a mouse.

## Technical notes
- `AddTaskDialog.tsx`: add `description` state, `Textarea`, 100-char clamp; extend the `onAdd` signature.
- `src/lib/tally.ts`: `addTask(title, category, date, description)` stores the value (null when blank).
- `src/routes/index.tsx`: pass the extended `addTask` through to Today and Tasks views.
- `EditTaskDialog.tsx`: `MAX_DESCRIPTION = 100`.
- `CategoryManager.tsx`: use native HTML5 drag events (draggable rows + `onDragOver`/`onDrop`) with a `GripVertical` handle; call a new `onReorder(ids: string[])`.
- `src/lib/categories.ts`: add `reorder(ids)` that persists the full order list, keeping `move` internally or removing it once unused.
