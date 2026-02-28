

# Convert Overflow-Prone Menus & Filters to Bottom Sheets on Mobile

## Scope

Every place in the app where a dropdown, popover, or horizontal filter bar can overflow the viewport on mobile will be converted to use a Drawer (bottom sheet) on mobile while keeping the desktop experience unchanged.

## Instances to Convert

### 1. Knowledge Bank Category & Type Filters (`CategoryFilter.tsx`)
Currently uses horizontal scrollable button rows that get cramped on mobile. On mobile, replace with a single "Filter" button that opens a Drawer showing Category and Type options as tappable lists with checkmarks for selected values.

### 2. Notification Settings Popover (`NotificationSettings.tsx`)
Uses a `Popover` that can clip on small screens. On mobile, render as a Drawer instead.

### 3. Exercise Card — "Link as Superset" dropdown (bottom of `ExerciseCard.tsx`, ~line 307)
A second `DropdownMenu` inside the card body for linking supersets. On mobile, open a Drawer with the list of linkable exercises.

### 4. Meal Plan Generator — Quick-log Popover (`MealPlanGenerator.tsx`)
Uses a `Popover` for meal slot selection when logging a recipe. On mobile, render as a Drawer.

### 5. Body Entry Form — Date Picker Popover (`BodyEntryForm.tsx`)
Calendar popover that can clip. On mobile, render inside a Drawer.

### 6. Date Navigator — Calendar Popover (`DateNavigator.tsx`)
Same pattern — calendar in a popover. On mobile, use a Drawer.

### 7. Daily Program Workout — Move-to-day Popover (`DailyProgramWorkout.tsx`)
Popover with calendar + button for moving a workout. On mobile, use a Drawer.

### 8. Desktop Exercise Card kebab menu (`ExerciseCard.tsx`, ~line 186)
Already has the mobile ExerciseActionSheet. The desktop dropdown also needs `collisionPadding` and `max-h` scroll (already applied globally). No additional changes needed here.

## Implementation Approach

Create a reusable `ResponsiveSheet` component that:
- Accepts `open`, `onOpenChange`, `trigger` (optional), `title`, and `children`
- On mobile (`useIsMobile()`): renders a `Drawer` with `DrawerContent`, `DrawerHeader`, `DrawerTitle`
- On desktop: renders a `Popover` with `PopoverContent` (or passes through children directly)

This single component eliminates the need to duplicate mobile/desktop logic in every file.

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/ui/responsive-sheet.tsx` | **New** — Reusable wrapper: Drawer on mobile, Popover on desktop |
| `src/components/vault/CategoryFilter.tsx` | On mobile, collapse filters into a "Filter" button → Drawer with category + type lists |
| `src/components/vault/NotificationSettings.tsx` | Wrap in `ResponsiveSheet` instead of raw `Popover` |
| `src/components/nutrition/MealPlanGenerator.tsx` | Wrap quick-log popover in `ResponsiveSheet` |
| `src/components/progress/BodyEntryForm.tsx` | Wrap date picker in `ResponsiveSheet` |
| `src/components/nutrition/DateNavigator.tsx` | Wrap calendar popover in `ResponsiveSheet` |
| `src/components/tracks/DailyProgramWorkout.tsx` | Wrap move-to-day popover in `ResponsiveSheet` |
| `src/components/workout/ExerciseCard.tsx` | Wrap the inline "Link as Superset" dropdown in `ResponsiveSheet` |

## Technical Detail

```text
ResponsiveSheet
├── isMobile? → <Drawer>
│                 <DrawerContent>
│                   <DrawerHeader><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
│                   <div className="px-4 pb-6">{children}</div>
│                 </DrawerContent>
│               </Drawer>
└── desktop?  → <Popover>
                  <PopoverTrigger>{trigger}</PopoverTrigger>
                  <PopoverContent>{children}</PopoverContent>
                </Popover>
```

Each converted component passes its existing content as `children` to `ResponsiveSheet`, so the actual UI options remain identical — only the container changes based on screen size.

