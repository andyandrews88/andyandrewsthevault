

# Plan: Rebuild Direct Messaging System

## The Core Problems
1. No concept of "conversations" - all DMs are dumped into a single pane
2. Admin sees messages from multiple clients mixed together
3. Replies go to a random recipient
4. No gate on `private_coaching_enabled` - anyone can receive DMs
5. RLS blocks user replies but UI shows a reply box

## Option A: Per-Client Conversation Threads (Recommended)

The DM section in the sidebar becomes expandable, showing each client as a separate conversation. This keeps DMs inside the existing community page.

```text
DIRECT MESSAGES
  ▸ Shannon          (2 unread)
  ▸ Marcus
  ▸ Jordan           (1 unread)
```

Clicking a name opens that specific 1-on-1 conversation.

### What changes

**Database:**
- Add RLS policy allowing private coaching clients to INSERT DMs (reply to their coach)
- Add RLS policy allowing admins to read ALL DMs (not just their own)
- Gate DM visibility: only users with `private_coaching_enabled = true` see the DM section

**Store (`communityStore.ts`):**
- Replace flat `directMessages` array with a grouped structure: `Map<userId, DirectMessage[]>`
- Add `activeDmConversationUserId` to track which conversation is open
- Fetch DM conversation partners (distinct user IDs) separately from messages
- `sendDirectMessage` stays the same but now both admin and client can call it

**Sidebar (`ChannelSidebar.tsx`):**
- Replace single "Coach Messages" button with a list of conversation partners
- For regular users: show just "Coach" (their coach)
- For admins: show each private coaching client as a separate entry
- Each entry shows unread badge per conversation
- Only visible when `private_coaching_enabled = true` (for clients) or `isAdmin` (for coaches)

**DM Pane (`DirectMessagePane.tsx`):**
- Rewrite to accept a `conversationPartnerId` prop
- Filter messages to only that specific partner
- Show correct header (partner name, not generic "Coach")
- Reply goes to that specific partner

**Admin Profile (`AdminUserProfile.tsx`):**
- DM composer stays, but now properly opens the per-client conversation

### Effort: Medium (4-5 files, 1 migration)

---

## Option B: Separate Inbox Page

Create a dedicated `/inbox` route with a proper two-panel inbox (conversation list on left, messages on right). Fully decoupled from the community tab.

### What changes
- New `/inbox` route and page component
- Conversation list panel with search/filter
- Message thread panel per conversation
- Nav link added to main tabs or navbar
- Same database and RLS changes as Option A
- Same `private_coaching_enabled` gate

### Effort: High (new page, new components, nav changes)
### Downside: Adds another top-level tab, more UI surface to maintain, and splits communication across two places

---

## Option C: Keep Single Pane, Add Conversation Switcher

Minimal change: keep the DM pane but add a dropdown/tabs at the top to switch between conversation partners. The sidebar still shows one "Messages" entry.

### What changes
- Fetch distinct conversation partners
- Add a partner selector dropdown at top of DM pane
- Filter messages by selected partner
- Same database and RLS changes

### Effort: Low-Medium (2-3 files, 1 migration)
### Downside: Less discoverable than Option A; admin won't see at a glance who has unread messages

---

## Recommendation

**Option A** is the right balance. It keeps everything in the community tab (no clutter), gives clear per-client conversations, shows unread counts per person, and gates access to private coaching clients only. It's also the pattern users expect from any messaging app.

### Technical details for Option A

**Migration SQL:**
- Add INSERT policy on `direct_messages` for users where `private_coaching_enabled = true` in their profile
- Add SELECT policy so admins can read all DMs (they currently can't - only sender/recipient can)

**Files to modify:**
- `src/stores/communityStore.ts` - grouped conversations, per-partner fetching
- `src/components/community/ChannelSidebar.tsx` - per-client DM entries
- `src/components/community/DirectMessagePane.tsx` - full rewrite for per-conversation view
- `src/components/community/CommunityFeed.tsx` - pass conversation partner ID to DM pane
- `src/hooks/useCommunityRealtime.ts` - update DM subscription for conversation grouping

**Files unchanged:**
- `AdminUserProfile.tsx` DM composer works as-is (sends to specific user)
- Database schema (no new tables needed)

