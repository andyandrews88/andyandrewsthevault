

# Fix Dropdown Menu Overflow & Improve Mobile UX

## Problem
The exercise kebab menu contains many items (Load Last Session, Link Superset, Replace Exercise, + 5 admin items, Remove Exercise). On mobile, the menu extends beyond the viewport — items like "Remove Exercise" are cut off or unreachable.

## Root Cause
The `DropdownMenuContent` component lacks:
1. A `max-height` with scroll for long menus
2. `collisionPadding` to keep the menu within viewport bounds
3. Sub-menus (`DropdownMenuSubContent`) also lack collision padding

## Changes

### 1. `src/components/ui/dropdown-menu.tsx` — Global collision safety
- Add `collisionPadding={8}` to `DropdownMenuContent` so Radix auto-repositions menus to stay within viewport
- Add `collisionPadding={8}` to `DropdownMenuSubContent` for the same reason
- Add `className` with `max-h-[80vh] overflow-y-auto` to `DropdownMenuContent` so long menus scroll instead of overflowing

### 2. `src/components/workout/ExerciseCard.tsx` — Explicit side preference
- Add `side="bottom"` and `align="end"` to the kebab menu's `DropdownMenuContent` (already has `align="end"`, just ensuring consistency)

These two changes ensure that **every** dropdown menu in the app respects viewport boundaries — fixing this globally rather than per-component.

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/dropdown-menu.tsx` | Add `collisionPadding` and `max-h` scroll to Content and SubContent |

