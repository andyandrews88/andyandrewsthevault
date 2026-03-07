

# Knowledge Bank — Netflix/YouTube Redesign Plan

## Overview
Replace the current flat card grid in `LibraryTab.tsx` with a content-discovery UI featuring a hero featured card, horizontal scroll rows, filter pills, and category sections — all with the dark theme and cyan accent system already in place.

## Architecture

The current `LibraryTab.tsx` (332 lines) will be completely rewritten. Supporting sub-components will be created for modularity. The existing data layer (`vaultService.ts`, `ResourceModal`, admin editing) remains untouched.

### New File Structure

| File | Purpose |
|------|---------|
| `src/components/vault/LibraryTab.tsx` | Rewrite — orchestrates all sections, data fetching, filtering, state |
| `src/components/vault/library/LibraryHeader.tsx` | New — "Knowledge Bank" title, pulsing dot, resource count pill |
| `src/components/vault/library/LibrarySearchBar.tsx` | New — dark rounded search input with cyan focus glow |
| `src/components/vault/library/LibraryFilterPills.tsx` | New — two rows of horizontal scroll filter pills (type + category) |
| `src/components/vault/library/FeaturedDropCard.tsx` | New — large hero card for newest/pinned resource with type-specific motifs |
| `src/components/vault/library/TrendingRow.tsx` | New — horizontal scroll row of medium ~200px cards with accent bars and badges |
| `src/components/vault/library/CategorySection.tsx` | New — compact horizontal list items grouped by category |
| `src/components/vault/library/ContentTypeIndicator.tsx` | New — reusable type icon + label + metadata component |

### Font Addition
Add Bebas Neue to the Google Fonts import in `index.css` and add a `font-display` utility class. DM Sans will also be added for body text alongside the existing Inter.

## Section-by-Section Design

### 1. Header (`LibraryHeader`)
- "KNOWLEDGE BANK" in Bebas Neue, large
- Pulsing cyan dot + "Updated this week" text (CSS `@keyframes pulse-dot`)
- Resource count in a small pill badge

### 2. Search Bar (`LibrarySearchBar`)
- Rounded, `bg-[#141414]` background, `border-white/5`
- `focus-within:border-[#00E5FF] focus-within:shadow-[0_0_15px_rgba(0,229,255,0.15)]` glow effect
- Search icon inside

### 3. Filter Pills (`LibraryFilterPills`)
- **Row 1** (Content Type): All, 🎙 Podcast, 📄 PDF, 🎥 Video, 📝 Article — horizontal scroll
- **Row 2** (Category): All, New, Training, Nutrition, Lifestyle
- Active pill: `bg-[#00E5FF] text-black`. Inactive: `bg-[#141414] text-muted-foreground`
- "New" filter = resources created within last 7 days

### 4. Featured Drop (`FeaturedDropCard`)
- Picks the first `is_featured` resource, or the newest resource
- Dark card with subtle cyan radial gradient in corner
- Badges: "NEW DROP" (if < 7 days old), category pill (colored by category), content type pill
- Bold title, 2-line description, metadata row (duration/pages + mock view count)
- CTA button: "Watch Now →" / "Listen Now →" / "Read Now →" based on type
- Bookmark/star icon button (toggle state, visual only for now — no DB persistence)
- Background motif varies by type using CSS gradients/shapes

### 5. Trending Row (`TrendingRow`)
- Horizontal scroll container with `overflow-x-auto`, `scrollbar-hide`
- Each card ~200px wide, fixed height
- Colored top accent bar (3px gradient)
- Badge: "HOT" (orange), "TRENDING" (red), "POPULAR" (purple) — assigned round-robin or by recency
- Large emoji per category (🏋️ Training, 🥗 Nutrition, 🧘 Lifestyle)
- Content type indicator, title (2-line clamp), description (2-line clamp), duration/read time
- Bookmark button
- Mock view counts for social proof

### 6. Category Sections (`CategorySection`)
- One section per category: Training (#FF6B35), Nutrition (#39FF14), Lifestyle (#00E5FF)
- Category pill header + "See all →" link (filters to that category)
- Compact horizontal list items: emoji, type icon, title, "NEW" badge if recent, duration, bookmark button

## Data Flow
- All data still fetched via `fetchResources()` + `fetchPodcasts()` from `vaultService.ts`
- Combined into unified `FeedItem[]` array (reusing pattern from `LatestUpdates.tsx`)
- Filtering/search applied client-side via `useMemo`
- Clicking any item opens existing `ResourceModal` or external link (unchanged behavior)
- Admin add/edit/delete/feature functionality preserved via existing handlers

## Styling Approach
- All custom colors applied via Tailwind arbitrary values (`bg-[#0A0A0A]`, `text-[#00E5FF]`)
- Category color map: `{ training: '#FF6B35', nutrition: '#39FF14', lifestyle: '#00E5FF' }`
- Pulsing dot animation added to `index.css` as a `@keyframes` rule
- Cards use `border-white/[0.06]` for subtle borders
- Smooth hover/press states via Tailwind transitions

## What Stays Unchanged
- `ResourceModal` — opens on click, handles all content types
- `ResourceEditor` — admin create/edit dialog
- `vaultService.ts` — all DB operations
- `CategoryFilter.tsx` — will be replaced by new `LibraryFilterPills` (old component kept but no longer imported)
- `ResourceCard.tsx` — replaced by new card components inline (old component kept)

## Implementation Order
1. Add fonts + CSS animations to `index.css`
2. Create all 6 sub-components in `src/components/vault/library/`
3. Rewrite `LibraryTab.tsx` to compose the new sections
4. Preserve all admin functionality (add/edit/delete/feature buttons integrated into new cards)

