

# Admin Exercise Metadata from Exercise Card (Train Section)

## Summary
When viewing an exercise card during a workout, the admin should see extra menu options to set the movement pattern, equipment type, and video URL for that exercise — saving directly to the `exercise_library` table. Regular users won't see these options.

## Database Migration
Add `movement_pattern` and `equipment_type` columns to `exercise_library`:

```sql
ALTER TABLE exercise_library ADD COLUMN movement_pattern text;
ALTER TABLE exercise_library ADD COLUMN equipment_type text DEFAULT 'other';
```

## Code Changes

### 1. `src/components/workout/ExerciseCard.tsx`
- Import `useAdminCheck` hook
- In the kebab dropdown menu, add an admin-only section (gated by `isAdmin`):
  - **Movement Pattern** submenu — lists all 9 patterns (Hinge, Squat, Push, Pull, Single Leg, Core, Carry, Olympic, Isolation). Selecting one upserts the `exercise_library` row with the chosen `movement_pattern`
  - **Equipment Type** submenu — lists all 8 types (Barbell, Dumbbell, Kettlebell, Machine, Cable, Sandbag, Bodyweight, Other). Selecting one upserts the row with the chosen `equipment_type`
  - **Set Video URL** menu item — opens a small dialog with an input field for the video URL, saves to `exercise_library.video_url`
- The upsert logic: query `exercise_library` by name; if exists, update; if not, insert a new row with name, category (default 'strength'), and the chosen field
- Show a toast on success

### 2. `src/components/workout/ConditioningCard.tsx`
- Same admin-only menu items (pattern, equipment, video URL) added to the kebab dropdown
- Same upsert logic

### 3. `src/components/admin/ExerciseLibraryAdmin.tsx`
- Add `movement_pattern` and `equipment_type` fields to the form
- Display pattern/equipment badges in the exercise list rows
- Update `handleSave` to include both new columns

### 4. `src/lib/movementPatterns.ts`
- Add `classifyExerciseWithDb(name, dbPattern?, dbEquipment?)` that uses DB values when available, falling back to hardcoded maps
- Update `getEquipmentType` to accept an optional DB override

### 5. `src/components/workout/MovementBalanceChart.tsx`
- When fetching exercise data, also query `exercise_library` for stored `movement_pattern` and `equipment_type`
- Use DB values as primary classification source, fall back to hardcoded

## Files Changed

| File | Change |
|------|--------|
| DB migration | Add `movement_pattern` and `equipment_type` columns |
| `ExerciseCard.tsx` | Admin-only submenu items for pattern, equipment, video URL |
| `ConditioningCard.tsx` | Same admin-only submenu items |
| `ExerciseLibraryAdmin.tsx` | Add pattern + equipment fields to form and list |
| `movementPatterns.ts` | DB-aware classification helpers |
| `MovementBalanceChart.tsx` | Use DB-stored pattern/equipment for classification |

