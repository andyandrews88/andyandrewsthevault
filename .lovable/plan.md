

## Plan: World-Class Community Chat Overhaul

The current community chat is wrapped in a bordered box with `height: calc(100vh - 200px)` — wasting ~200px on the page header, tab bar, and outer padding. Messages use a generic forum-card layout (PostCard with borders around each message) rather than a flowing chat feel. The input is a multi-line textarea with a separate send button, instead of a sleek single-line input bar pinned to the bottom.

### What Changes

**1. Full-height chat layout (`CommunityFeed.tsx`)**
- Remove the `rounded-xl border` wrapper and the `calc(100vh - 200px)` constraint
- On mobile, use `h-[calc(100vh-120px)]` (just bottom nav + mobile header) so chat fills the screen
- On desktop, use `h-[calc(100vh-180px)]` 
- Remove the redundant mobile header bar (the channel name is already clear from the sidebar)— or keep it ultra-compact (just `# general` + hamburger, 36px tall)

**2. Slack/Discord-style message layout (`MessageItem.tsx`)**
- Remove PostCard entirely from the channel feed — messages render as `MessageItem` directly (already happening, PostCard is unused in channel feed)
- Keep the current hover-to-show-actions pattern (already good)
- Make message content `text-sm text-foreground/90` (not muted)
- Show reply count inline as a subtle clickable link below content when > 0 replies, always visible (not just on hover)
- Add a subtle divider between messages from different users but group consecutive messages from the same user (compact mode — no avatar, just content with left margin)

**3. Sleek message input bar (`ChannelFeed.tsx`)**
- Replace the `Textarea` + separate `Button` with a single-line `Input` inside a rounded pill container
- Input grows to max 3 lines as user types (auto-resize)
- Send button is inside the input container (right side), circular, primary color
- Placeholder: `Message #general`
- Enter to send (not Ctrl+Enter), Shift+Enter for newline

**4. Message grouping**
- Group consecutive messages from the same user within 5 minutes
- First message in group shows avatar + name + time
- Subsequent messages show only content, indented under the avatar (no repeated name/avatar)

**5. Channel header compaction (`ChannelFeed.tsx`)**
- Reduce to a single thin bar: `# channel-name | description` — 36px tall max
- Match the screenshot: `# general  General discussion`

**6. Empty state**
- Simpler: just the `#channel-name` text centered with "This is the start of #general" message, like Discord/Slack

### Files to Edit
- `src/components/community/CommunityFeed.tsx` — full-height layout, remove border wrapper
- `src/components/community/ChannelFeed.tsx` — message input redesign, Enter-to-send, grouping logic, compact header
- `src/components/community/MessageItem.tsx` — always-visible reply count, grouped message support (compact prop when same user)
- `src/components/community/DirectMessagePane.tsx` — same input bar treatment, full height

### What Does NOT Change
- No database changes
- No store/logic changes
- Channel sidebar stays the same
- Thread drawer stays the same
- All existing functionality (likes, replies, edit, delete) preserved

