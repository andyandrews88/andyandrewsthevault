

# Fix: YouTube Shorts Not Playing in Library

## Problem

YouTube Shorts URLs use the format `youtube.com/shorts/VIDEO_ID`. The current `toEmbedUrl` function only recognizes two URL patterns:
- `youtu.be/VIDEO_ID`
- `youtube.com/watch?v=VIDEO_ID`

Shorts URLs don't match either pattern, so the raw URL is passed directly to the iframe, which fails to load.

## Fix

### File: `src/lib/vaultService.ts`

Add a regex match for the YouTube Shorts format inside the existing `toEmbedUrl` function. The video ID extraction is the same -- Shorts are regular YouTube videos, they just use a different URL path.

Add this pattern after the existing `watchMatch` check:

```
// youtube.com/shorts/VIDEO_ID format
const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
if (shortsMatch) videoId = shortsMatch[1];
```

The extracted ID gets embedded using the standard `youtube.com/embed/VIDEO_ID` URL, which works for all YouTube video types including Shorts.

## Technical Details

| File | Change |
|------|--------|
| `src/lib/vaultService.ts` | Add Shorts URL pattern to `toEmbedUrl` function (1 line addition) |

One file, one small change. No database changes needed.

