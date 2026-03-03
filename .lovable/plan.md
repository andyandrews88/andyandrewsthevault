

# Fix Plan: 4 Issues — Private Coaching, PT Session Edit, Client Directory Scroll, AI Report Scroll

## Issues Identified

1. **Private Coaching toggle exists but is buried** — The Switch is at line 433 of `AdminUserProfile.tsx`, inside the header next to the user's name. On mobile, this is hard to find because the header is crowded. The code IS there and functional, but the UX fails on mobile because it's small and blends in. Fix: make it a prominent, styled card at the top of the profile.

2. **PT Session edit button exists but is invisible on mobile** — The edit (Pencil) icon IS in the code at line 322-324 of `PTSessionTracker.tsx`. However, looking at the screenshot, only the delete (trash) icon shows. The issue is the two buttons are in a flex container that's too narrow — the column header is `w-10` (40px) which only fits one icon. Fix: widen the action column and ensure both buttons render visibly.

3. **Client Directory (AdminDetailDrawer) can't scroll on mobile** — The SheetContent has `overflow-y-auto` but the Table inside the users section has no wrapper to handle mobile overflow. The `SheetContent` scroll should work, but the content may be blocked by touch events on the Table. Fix: wrap the table in a `ScrollArea` and ensure the sheet uses proper mobile scrolling.

4. **AI Client Report cards can't scroll** — `ClientAIReport.tsx` line 154 uses `ScrollArea` with `max-h-[600px]`. On mobile, `ScrollArea` with a fixed max-height inside a collapsible section can trap scroll events. Fix: remove the fixed `max-h` constraint and let the content flow naturally, or increase the height significantly.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/AdminUserProfile.tsx` | Make Private Coaching toggle a prominent card instead of a tiny switch in the header |
| `src/components/admin/PTSessionTracker.tsx` | Widen action column from `w-10` to `w-20` so both Edit and Delete icons show on mobile |
| `src/components/admin/AdminDetailDrawer.tsx` | Fix mobile scrolling: wrap users table section in a proper scrollable container, ensure touch scroll works |
| `src/components/admin/ClientAIReport.tsx` | Remove `max-h-[600px]` from ScrollArea to prevent scroll trapping on mobile |

## Detail

### 1. Private Coaching Toggle (AdminUserProfile.tsx)
Move the toggle out of the cramped header area. Add a dedicated, visually prominent card right below the header:
- Gold/accent-bordered card with Shield icon
- Large Switch toggle with clear "Private Coaching Access" label
- Description text explaining what it does
- This makes it impossible to miss

### 2. PT Session Edit (PTSessionTracker.tsx)
- Change the action column `TableHead` from `w-10` to `w-20`
- The edit and delete buttons are already implemented — they just need space to render

### 3. Client Directory Scroll (AdminDetailDrawer.tsx)
- The `SheetContent` has `overflow-y-auto` which should work, but on mobile Safari/Chrome, nested scrollable areas can conflict
- Wrap the entire users section content (stat cards + filters + table) in a `div` with explicit `overflow-y-auto` and `-webkit-overflow-scrolling: touch`
- Add `overscroll-behavior-y: contain` to prevent scroll chaining

### 4. AI Report Scroll (ClientAIReport.tsx)
- Replace `ScrollArea className="max-h-[600px]"` with just a regular `div` — the parent `CollapsibleDashboardSection` already handles the layout
- This prevents the nested scroll trap where mobile users can't scroll past the AI report

