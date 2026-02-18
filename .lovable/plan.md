
# Four-Part Plan: Anonymous Fix + CTA Replacement + Community Rebuild + Admin DMs

---

## Overview

This plan addresses four items in priority order:
1. **Fix Anonymous names** — database migration to insert missing profiles
2. **Replace $49/mo CTA** — swap for a "Post a Question" button that navigates to community
3. **Rebuild the Community** — Discord-style channels, mobile-friendly layout, optimistic updates
4. **Admin Private DMs** — ability to message any user privately from their profile page

---

## Part 1: Fix Anonymous Names (Root Cause)

**Confirmed root cause from database inspection:** The two original accounts — `andyandrewscf@gmail.com` and `andrewsandycf@gmail.com` — have **no rows in `user_profiles` at all**. Every community post comes from `andyandrewscf`, so the `fetchProfile` call returns `null`, the UI falls back to `'Anonymous'`.

This is different from the "display_name = Anonymous" issue addressed last time. The trigger simply didn't exist when these accounts were created.

**Fix — database migration:**
```sql
-- Insert missing profiles for all auth users who have no profile row
INSERT INTO public.user_profiles (id, display_name)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1)
  )
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE up.id IS NULL;
```

This runs once and covers all past and any future gap accounts. No code changes needed for the fix itself — once the profile row exists, the existing `fetchProfile` logic in `communityStore.ts` will find it and display the real name.

**Admin Dashboard names fix:** The admin `admin-analytics` and `admin-detail` edge functions already return `displayName` from `user_profiles`. Once the migration inserts missing profiles, admin views will also show real names automatically.

---

## Part 2: Replace "$49/mo" CTA in Audit Results

**Location:** `src/components/audit/ResultsPage.tsx` — the "Access The Vault" card at the bottom (lines 295–303).

**New behavior based on auth state:**
- If user is **already logged in**: Button says "Ask a Question in Community" → navigates to `/vault` with `?tab=community` query param, and the community tab auto-opens.
- If user is **not logged in**: Button says "Join The Vault Free" → navigates to `/auth` with a redirect back. No price mentioned.

**Implementation:**
- Replace the `Lock` + "Join The Vault - $49/mo" button in `ResultsPage.tsx`
- Import `useAuthStore` to check auth state
- Use `useNavigate` to go to `/vault?tab=community` for logged-in users
- Use `Link to="/auth"` for guests

Additionally, the results page can show a "Recommended Resources" shortcut based on which leaks were detected — linking directly to the vault library with the relevant category pre-filtered. This replaces the paywalled CTA with genuine value.

---

## Part 3: Community Rebuild — Discord-Style with Channels

This is a significant rebuild of the community tab. The existing `community_messages` table lacks a `channel_id` column. We need to add channels.

### Database Changes

**New table: `community_channels`**
```sql
CREATE TABLE public.community_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,           -- e.g. "general", "pr-board"
  description text,
  category text NOT NULL DEFAULT 'THE VAULT',  -- section grouping
  order_index integer NOT NULL DEFAULT 0,
  is_locked boolean NOT NULL DEFAULT false,     -- only admin can post
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default channels
INSERT INTO public.community_channels (name, description, category, order_index) VALUES
  ('announcements', 'Official updates from Andy', 'THE VAULT', 0),
  ('general', 'General discussion', 'THE VAULT', 1),
  ('introductions', 'Introduce yourself to the community', 'THE VAULT', 2),
  ('pr-board', 'Share your personal records', 'TRAINING', 3),
  ('form-checks', 'Post videos for form feedback', 'TRAINING', 4),
  ('programming', 'Training program questions', 'TRAINING', 5),
  ('nutrition', 'Nutrition questions and wins', 'LIFESTYLE', 6),
  ('recovery', 'Sleep, mobility, recovery discussion', 'LIFESTYLE', 7);
```

**Alter `community_messages` to add `channel_id`:**
```sql
ALTER TABLE public.community_messages 
  ADD COLUMN channel_id uuid REFERENCES public.community_channels(id) ON DELETE SET NULL;

-- Default existing messages to "general" channel
UPDATE public.community_messages 
SET channel_id = (SELECT id FROM public.community_channels WHERE name = 'general' LIMIT 1);
```

**New table: `direct_messages`** (for Part 4 — admin DMs)
```sql
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can read DMs sent to them or from them
CREATE POLICY "Users can read their DMs"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- Only admins can send DMs
CREATE POLICY "Admins can send DMs"
  ON public.direct_messages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Enable realtime for DMs
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
```

**RLS for channels (public read, admin write):**
```sql
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view channels" ON public.community_channels FOR SELECT USING (true);
CREATE POLICY "Admins can manage channels" ON public.community_channels FOR ALL USING (has_role(auth.uid(), 'admin'));
```

### New Layout Architecture

The community tab gets a full layout rebuild with three zones:

```text
┌─────────────────────────────────────────────────────┐
│ Desktop Layout                                       │
├──────────┬─────────────────────────────────────────┤
│ Channel  │ Active Channel Feed                      │
│ Sidebar  │                                          │
│          │  [Sticky Header: #channel-name]          │
│ THE VAULT│                                          │
│ #general │  [ScrollArea of messages]                │
│ #pr-board│                                          │
│          │  [Fixed bottom: message input]           │
│ TRAINING │                                          │
│ #form... │                                          │
├──────────┴─────────────────────────────────────────┤
│ Mobile: Bottom tab bar + hamburger for channels     │
└─────────────────────────────────────────────────────┘
```

### New/Modified Files

**New: `src/components/community/ChannelSidebar.tsx`**
- Lists channels grouped by category (THE VAULT, TRAINING, LIFESTYLE)
- Active channel highlighted with accent color
- Unread indicator dots (future)
- On mobile: hidden, triggered by hamburger sheet

**New: `src/components/community/ChannelFeed.tsx`**
- Replaces `CommunityFeed.tsx` as the main content area
- Sticky channel header bar at top (`#channel-name`)
- `ScrollArea` for message list, auto-scrolls to bottom on new messages
- Fixed bottom message input with auto-expand
- Optimistic updates: message appears immediately in UI before DB confirmation

**New: `src/components/community/MessageItem.tsx`**
- Avatar + display name + timestamp
- Message content with markdown support (bold, line breaks)
- "Reply" button → opens `ThreadDrawer` (existing, reused)
- Like button (existing, reused)
- Delete for own messages or admin

**Modified: `src/components/community/CommunityFeed.tsx`** → Becomes the layout wrapper
- Desktop: `grid grid-cols-[240px_1fr]` with `ChannelSidebar` + `ChannelFeed`
- Mobile: `flex flex-col` with sheet-based channel switcher + `ChannelFeed`

**Modified: `src/stores/communityStore.ts`**
- Add `channels: CommunityChannel[]` state
- Add `activeChannelId: string | null` state
- Add `fetchChannels()` action
- Add `setActiveChannel(channelId)` action
- Modify `fetchPosts()` to filter by `channel_id`
- Add optimistic post creation (append immediately, then DB insert, rollback on error)

**Modified: `src/hooks/useCommunityRealtime.ts`**
- Filter realtime subscription to active channel: `filter: 'channel_id=eq.' + activeChannelId`
- Add DM realtime subscription

### Optimistic Updates

When a user sends a message:
1. Immediately append a temporary message object to `posts` with `id: 'optimistic-' + Date.now()`, `user_profile` from current user's cached profile
2. Insert to database in background
3. On success: replace optimistic message with real one from realtime event
4. On failure: remove optimistic message, show toast error

### Mobile Behavior
- Channels hidden by default, accessible via a `Sheet` triggered by hamburger icon in sticky header
- Thread drawer is full-screen on mobile (existing Sheet behavior works)
- Bottom of screen: fixed input bar

---

## Part 4: Admin Private DMs

### From Admin User Profile Page
On `AdminUserProfile.tsx`, add a new "Send Message" section at the bottom:
- A textarea input labeled "Private message to [user name]"
- A send button
- Below it, show message history (admin → this user only)
- Calls `supabase.from('direct_messages').insert({ from_user_id: adminId, to_user_id: userId, content })`

### User Receives DMs in Community Tab
A dedicated "Direct Messages" section appears in the community layout:
- In the `ChannelSidebar`, below channel groups, add a "DIRECT MESSAGES" section
- Shows a list of DM senders (only admin in practice) with unread indicator
- Clicking opens `DirectMessagePane` — a conversation view showing messages from that thread
- Real-time via the `direct_messages` realtime subscription

**New: `src/components/community/DirectMessagePane.tsx`**
- Shows conversation between current user and admin
- Auto-marks messages as read on open (`UPDATE direct_messages SET is_read = true WHERE to_user_id = currentUser AND from_user_id = adminId`)
- Real-time: subscribes to `direct_messages` filtered to `to_user_id=eq.currentUserId`
- Unread count badge on sidebar icon

**Modified: `src/pages/AdminUserProfile.tsx`**
- Add "Send Private Message" card at bottom
- Textarea + send button
- Shows sent message history (admin's DMs to this user)

---

## Technical Details Summary

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/community/ChannelSidebar.tsx` | Discord-style channel list, grouped by category |
| `src/components/community/ChannelFeed.tsx` | Main message feed for active channel |
| `src/components/community/MessageItem.tsx` | Individual message row with avatar/actions |
| `src/components/community/DirectMessagePane.tsx` | Private DM conversation view |

### Files to Modify
| File | Change |
|------|--------|
| `src/components/community/CommunityFeed.tsx` | Rebuild as layout wrapper with sidebar + feed |
| `src/stores/communityStore.ts` | Add channels state, activeChannelId, optimistic updates, DM support |
| `src/hooks/useCommunityRealtime.ts` | Filter by channel, add DM subscription |
| `src/components/audit/ResultsPage.tsx` | Replace $49/mo CTA with auth-aware community/join button |
| `src/pages/AdminUserProfile.tsx` | Add "Send Private Message" section |

### Database Migrations
1. Insert missing `user_profiles` for `andyandrewscf@gmail.com` and `andrewsandycf@gmail.com` (and any future gaps)
2. Create `community_channels` table and seed default channels
3. Add `channel_id` to `community_messages`, default existing posts to `#general`
4. Create `direct_messages` table with admin-only insert RLS + realtime
5. Add `community_channels` to realtime publication

### What Stays the Same
- `ThreadDrawer.tsx` — reused as-is for reply threads
- `LikeButton.tsx` — reused as-is
- `PostCard.tsx` → replaced by `MessageItem.tsx` with the same data but new layout
- `PostComposer.tsx` — reused inside `ChannelFeed` for the bottom input
- All RLS policies on `community_messages` — unchanged

### Key Behaviors
- **Switching channels** clears the post list and fetches messages for the new channel
- **New messages** appear instantly via optimistic update + realtime
- **Unread DM badge** appears on the sidebar for users with unread admin messages
- **Admin DMs are private** — the RLS `SELECT` policy requires `to_user_id = auth.uid() OR from_user_id = auth.uid()`, so users can only see their own DM thread
