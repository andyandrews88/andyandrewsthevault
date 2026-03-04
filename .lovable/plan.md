

# Plan: Exercise Request & Approval System

## Problem
Many movements aren't in the exercise library. Currently, when a user types a custom exercise name, it gets added with no metadata. The admin has no visibility into what's been added and can't efficiently review/configure new exercises.

## Solution
When a user adds a custom exercise (one not in the predefined list), automatically create a pending entry in the `exercise_library` table and surface it to the admin for review.

### Database Changes
- Add a `status` column to `exercise_library` with values `'approved'` (default for existing) and `'pending'`
- Add a `submitted_by` column (nullable uuid) to track who requested it
- Update RLS: allow authenticated users to INSERT with `status = 'pending'` (currently admin-only)
- Migration backfills all existing rows as `'approved'`

### How It Works

**User side (ExerciseSearch.tsx):**
- When a user types a custom name and selects "Add [name]", the system inserts a row into `exercise_library` with `status: 'pending'` and `submitted_by: user.id`
- User gets a toast: "Exercise added. Your coach will configure it shortly."
- The exercise still works in their workout immediately (no blocking)

**Admin side (AdminDashboard.tsx / ExerciseLibraryAdmin.tsx):**
- New badge on the admin dashboard: "X exercises pending review"
- In the Exercise Library admin panel, pending exercises appear at the top with a yellow "Pending" badge
- Admin clicks to edit, fills in movement pattern / equipment / video URL, then marks as approved
- Optionally: push notification to admin when new exercises are submitted

### Files to Modify

1. **Migration SQL** - Add `status` and `submitted_by` columns, update RLS for user INSERT of pending exercises
2. **`src/components/workout/ExerciseSearch.tsx`** - On custom exercise selection, insert pending row into `exercise_library`
3. **`src/components/admin/ExerciseLibraryAdmin.tsx`** - Show pending exercises at top with review UI, add approve button
4. **`src/pages/AdminDashboard.tsx`** - Add pending exercise count badge
5. **`src/lib/exerciseLibraryUpsert.ts`** - Minor update so upsert respects status field

### User Experience Flow

```text
User types "Zercher Squat" → not in list
  → Taps "Add Zercher Squat"
  → Row created: { name: "Zercher Squat", status: "pending", submitted_by: user_id }
  → Toast: "Exercise added! Coach will review shortly."
  → Exercise works in their workout immediately

Admin Dashboard shows: "3 exercises pending review"
  → Opens Exercise Library
  → Sees "Zercher Squat" with yellow PENDING badge at top
  → Sets movement pattern, equipment, video URL
  → Clicks "Approve" → status becomes 'approved'
```

