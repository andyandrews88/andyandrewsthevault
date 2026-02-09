
# Date-Based Food Diary + Threaded Community Chat System

## Overview

This plan implements two major features:
1. **Date Navigation for Nutrition Tracker** - Allow users to log food on different days and plan meals ahead
2. **Professional Threaded Chat System** - Transform the Community section into a full-featured discussion board with threaded replies

---

## Part 1: Date Navigation for Food Diary

### Current State

- Food diary stores meals in `mealBuilderStore.ts` with a single `currentMeal` array
- No date tracking - all entries are for "today"
- Foods are persisted locally but not tied to specific dates

### New UI Layout

```text
+--------------------------------------------------+
|  [<]  Today, Feb 9, 2026  [>]  [Calendar Icon]   |
+--------------------------------------------------+
|  Daily Summary Bar                               |
|  [1,847 / 2,400 cal]  P: 142g  C: 185g  F: 68g  |
+--------------------------------------------------+
|  BREAKFAST                              245 cal  |
|  ... foods ...                                   |
+--------------------------------------------------+
|  (rest of meal sections)                         |
+--------------------------------------------------+
```

### Features

1. **Date Navigation Bar**
   - Left/right arrow buttons to move between days
   - "Today" button to quickly return to current date
   - Calendar icon opens popover with date picker
   - Displays current date in readable format (e.g., "Mon, Feb 9")

2. **Date-Based Storage**
   - Each day's meals stored separately in the store
   - Keyed by date string (YYYY-MM-DD format)
   - Easy lookup for any past or future date

3. **Planning Ahead**
   - Navigate to future dates to plan meals
   - Helpful indicator if viewing past or future dates
   - Copy meals from one day to another (optional enhancement)

### Store Updates

New structure for `mealBuilderStore.ts`:

```typescript
interface DailyMeals {
  [date: string]: {
    breakfast: MealFood[];
    lunch: MealFood[];
    dinner: MealFood[];
    snacks: MealFood[];
  };
}

interface MealBuilderState {
  selectedDate: string; // YYYY-MM-DD
  dailyMeals: DailyMeals;
  // ... existing savedMeals, preferredUnit
}
```

### New Component: DateNavigator

Simple navigation component with:
- Previous day button
- Display of current selected date
- Next day button
- Calendar popover for jumping to any date
- "Today" quick button

### Files to Create/Modify

| File | Changes |
|------|---------|
| `src/stores/mealBuilderStore.ts` | Add date-based meal storage, selectedDate, meal slot assignment |
| `src/components/nutrition/DateNavigator.tsx` | **NEW** - Date navigation component |
| `src/components/nutrition/FoodDiary.tsx` | Add DateNavigator, use date-filtered meals |
| `src/components/nutrition/MealSection.tsx` | Accept meal slot from props for proper filtering |

---

## Part 2: Threaded Community Chat System

### Database Structure

**New Table: `community_messages`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `parent_id` | uuid (nullable) | Self-reference for threading |
| `content` | text | Message content |
| `is_thread_root` | boolean | True if top-level post |
| `created_at` | timestamptz | When posted |
| `updated_at` | timestamptz | Last edit time |
| `likes_count` | integer | Cached like count |

**New Table: `community_likes`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Who liked |
| `message_id` | uuid | Which message |
| `created_at` | timestamptz | When liked |

**New Table: `user_profiles`** (for display names)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (same as auth.users id) |
| `display_name` | text | User's display name |
| `avatar_url` | text (nullable) | Profile picture |
| `is_coach` | boolean | Verified coach badge |
| `created_at` | timestamptz | Account creation |

### RLS Policies

```sql
-- community_messages policies
-- SELECT: All authenticated users can read all messages
-- INSERT: Users can create messages (user_id = auth.uid())
-- UPDATE: Users can edit their own messages
-- DELETE: Users can delete their own messages OR admins

-- community_likes policies
-- SELECT: Anyone can see likes
-- INSERT: Users can like (one per message per user)
-- DELETE: Users can remove their own likes
```

### UI Components

**1. Main Feed (in Vault Community Tab)**

```text
+------------------------------------------+
|  [Write a post...]                       |
+------------------------------------------+

+------------------------------------------+
| 🟢 Marcus T.                    2h ago   |
| Just hit 10% improvement on squat...     |
|                                          |
| 💬 12 Replies  ❤️ 24                     |
+------------------------------------------+

+------------------------------------------+
| ⭐ Andy Andrews (Coach)         1d ago   |
| Weekly reminder: Your engine work...     |
|                                          |
| 💬 47 Replies  ❤️ 156                    |
+------------------------------------------+
```

**2. Thread View (Side Drawer)**

When clicking "Replies" or "View Thread":

```text
+------------------------------------------+
|  [X]  Thread                             |
+==========================================+
|  ORIGINAL POST                           |
|  Andy Andrews (Coach)          1d ago    |
|  Weekly reminder: Your engine work...    |
|  ❤️ 156                                  |
+------------------------------------------+
|  REPLIES (47)                            |
+------------------------------------------+
|  Marcus T.                     23h ago   |
|  This is exactly what I needed to hear   |
|  ❤️ 8                                    |
+------------------------------------------+
|  Sarah K.                      22h ago   |
|  Agreed! Made this mistake last month    |
|  ❤️ 5                                    |
+------------------------------------------+
|  ... more replies ...                    |
+------------------------------------------+
|  [Write a reply...]              [Send]  |
+------------------------------------------+
```

### Real-time Updates

Enable Supabase Realtime on `community_messages` table:
- New posts appear instantly in main feed
- New replies appear in thread drawer
- Like counts update in real-time

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
```

### New Components

| Component | Purpose |
|-----------|---------|
| `src/components/community/CommunityFeed.tsx` | Main feed showing root posts |
| `src/components/community/PostCard.tsx` | Single post display with reply count, likes |
| `src/components/community/ThreadDrawer.tsx` | Side drawer with original + replies |
| `src/components/community/ReplyList.tsx` | List of replies in a thread |
| `src/components/community/PostComposer.tsx` | Text input for new posts/replies |
| `src/components/community/LikeButton.tsx` | Heart button with optimistic updates |
| `src/stores/communityStore.ts` | Zustand store for posts and real-time state |
| `src/hooks/useCommunityRealtime.ts` | Hook for Supabase realtime subscriptions |

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `supabase/migrations/xxx_community_messages.sql` | Database tables + RLS |
| `src/stores/communityStore.ts` | **NEW** - Community state management |
| `src/hooks/useCommunityRealtime.ts` | **NEW** - Realtime subscription hook |
| `src/components/community/CommunityFeed.tsx` | **NEW** - Main feed component |
| `src/components/community/PostCard.tsx` | **NEW** - Post display |
| `src/components/community/ThreadDrawer.tsx` | **NEW** - Thread side panel |
| `src/components/community/ReplyList.tsx` | **NEW** - Reply list |
| `src/components/community/PostComposer.tsx` | **NEW** - Message composer |
| `src/components/community/LikeButton.tsx` | **NEW** - Like interaction |
| `src/pages/Vault.tsx` | Replace mock posts with CommunityFeed |

---

## Implementation Order

### Phase 1: Date Navigation (Nutrition)
1. Update `mealBuilderStore.ts` with date-based structure
2. Create `DateNavigator.tsx` component
3. Integrate into `FoodDiary.tsx`
4. Test date switching and meal slot persistence

### Phase 2: Community Database
1. Create migration for tables and RLS
2. Create `user_profiles` table with trigger for new users
3. Enable realtime on messages table

### Phase 3: Community UI
1. Create `communityStore.ts` for state
2. Build `PostCard.tsx` and `CommunityFeed.tsx`
3. Build `ThreadDrawer.tsx` with Sheet component
4. Add `PostComposer.tsx` and `LikeButton.tsx`
5. Integrate realtime hook
6. Replace mock data in Vault.tsx

---

## Technical Notes

### Date Handling

Using `date-fns` (already installed) for date formatting:
- `format(date, 'EEE, MMM d')` → "Sun, Feb 9"
- `format(date, 'yyyy-MM-dd')` → "2026-02-09" (storage key)

### Thread Queries

Efficient querying for threads:

```typescript
// Get all root posts (main feed)
const { data } = await supabase
  .from('community_messages')
  .select('*, user_profiles(*), reply_count:community_messages(count)')
  .is('parent_id', null)
  .order('created_at', { ascending: false });

// Get replies for a thread
const { data } = await supabase
  .from('community_messages')
  .select('*, user_profiles(*)')
  .eq('parent_id', threadId)
  .order('created_at', { ascending: true });
```

### Optimistic UI Updates

For likes and new posts:
- Immediately update local state
- Send request to Supabase
- Rollback if request fails
- Real-time will sync other users

### User Profiles Auto-Creation

Trigger to create profile when user signs up:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
```
