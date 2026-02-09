
# Fix: Video Not Loading in Resource Modal

## Problem Identified

The "Back Squat Tutorial" video shows a **no-entry symbol** (🚫) because the `embed_url` stored in the database is a **YouTube share link**, not an embed URL:

| Stored URL (Broken) | Required Format |
|---------------------|-----------------|
| `https://youtu.be/_s7wWVOgOc8?si=...` | `https://www.youtube.com/embed/_s7wWVOgOc8` |
| `https://youtube.com/watch?v=VIDEO_ID` | `https://www.youtube.com/embed/VIDEO_ID` |

YouTube blocks its share/watch URLs from loading in iframes, which is why the browser shows the "no-entry" symbol.

---

## Solution

Add a **URL transformation utility** that automatically converts YouTube and Vimeo share/watch URLs to their proper embed format. This will be applied when rendering videos in the ResourceModal.

### URL Transformations

**YouTube formats to handle:**
- `https://youtu.be/VIDEO_ID` → `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/watch?v=VIDEO_ID` → `https://www.youtube.com/embed/VIDEO_ID`
- `https://youtube.com/watch?v=VIDEO_ID` → `https://www.youtube.com/embed/VIDEO_ID`
- Already correct: `https://www.youtube.com/embed/VIDEO_ID` (no change)

**Vimeo formats to handle:**
- `https://vimeo.com/VIDEO_ID` → `https://player.vimeo.com/video/VIDEO_ID`
- Already correct: `https://player.vimeo.com/video/VIDEO_ID` (no change)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/vaultService.ts` | Add `toEmbedUrl()` helper function |
| `src/components/vault/ResourceModal.tsx` | Apply `toEmbedUrl()` when rendering iframes |

---

## Implementation Details

### New Helper Function in vaultService.ts

```typescript
// Convert various video URL formats to embed URLs
export function toEmbedUrl(url: string, type: 'youtube' | 'vimeo'): string {
  if (!url) return '';
  
  if (type === 'youtube') {
    // Already an embed URL
    if (url.includes('youtube.com/embed/')) return url;
    
    // Extract video ID from various formats
    let videoId = '';
    
    // youtu.be/VIDEO_ID format
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) videoId = shortMatch[1];
    
    // youtube.com/watch?v=VIDEO_ID format
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) videoId = watchMatch[1];
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  if (type === 'vimeo') {
    // Already an embed URL
    if (url.includes('player.vimeo.com/video/')) return url;
    
    // vimeo.com/VIDEO_ID format
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
  }
  
  return url;
}
```

### Update ResourceModal.tsx

Apply the transformation when rendering YouTube/Vimeo iframes:

```tsx
case 'youtube':
  return (
    <iframe
      src={toEmbedUrl(resource.embedUrl || '', 'youtube')}
      ...
    />
  );

case 'vimeo':
  return (
    <iframe
      src={toEmbedUrl(resource.embedUrl || '', 'vimeo')}
      ...
    />
  );
```

---

## Why This Approach?

1. **No database changes needed** - Existing URLs will work automatically
2. **User-friendly** - Admins can paste any YouTube/Vimeo URL format when adding resources
3. **Defensive** - Already-correct embed URLs pass through unchanged
4. **Centralized** - Single helper function handles all video URL transformations
