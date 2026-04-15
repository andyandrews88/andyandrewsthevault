

## Plan: Visual Polish — Match Mockup Design Language

The mockup and the current app share the same color system and fonts, but differ significantly in **density, typography scale, card styling, and layout** on mobile. Here is the gap analysis and proposed changes, organized to avoid breaking any functionality.

### Gap Analysis

| Area | Mockup | Current App | Impact |
|------|--------|-------------|--------|
| **Header** | Compact top bar: logo left, avatar right (~30px tall) | Large centered logo + badges + heading + subtitle = ~200px | High — wastes prime screen space |
| **Dashboard greeting** | "GOOD MORNING" in Bebas Neue + day eyebrow in JetBrains Mono, left-aligned | No greeting, "TODAY'S OVERVIEW" badge centered | Medium |
| **Readiness card** | Circular SVG ring (score) + 4-tile grid (emoji icons + mono values) with primary-tinted border | 3 separate full-width text cards in a column | High — most visible difference |
| **Card density** | ~11px padding, 8-10px body text, 7px labels, JetBrains Mono for values | ~16-24px padding, 14px body text, standard font | High |
| **Typography scale** | Compact: titles 10-12px, labels 7-8px mono, values 15px mono | Standard Tailwind: titles base, labels sm | Medium |
| **Card borders** | Colored tints per card type (primary glow, warning, success) | Uniform `border-primary/20` via `data` variant | Low-Medium |
| **Bottom nav** | Already similar | Already similar | None |

### Proposed Changes (Safe, Non-Breaking)

**Phase 1: Header Compaction (mobile only)**

1. **`src/pages/Vault.tsx`** — On mobile, replace the centered logo/badge/heading block with a compact top bar showing logo (left) + avatar circle (right), like the mockup's `.topbar`. Keep the current desktop layout unchanged.

**Phase 2: Dashboard Greeting**

2. **`src/components/dashboard/VaultDashboard.tsx`** — Add a greeting row above sections on mobile: day/date eyebrow in mono + "GOOD MORNING" / "GOOD AFTERNOON" / "GOOD EVENING" in `font-display` (Bebas Neue), left-aligned. Keep "TODAY'S OVERVIEW" badge on the right.

**Phase 3: Readiness Snapshot Redesign**

3. **`src/components/dashboard/TodaySnapshot.tsx`** — Redesign the readiness card to match the mockup:
   - Circular SVG ring showing readiness score percentage
   - 4-tile grid next to ring showing Sleep, Energy, Stress, Drive with emoji + mono value + label
   - Primary-tinted card border (`border-primary/20 bg-primary/5`)
   - Training and Body Comp cards stay as separate cards below but with tighter padding and mono values

**Phase 4: Global Card Density (mobile only)**

4. **`src/index.css`** — Add a mobile-specific utility class `.card-compact` for tighter padding and smaller text that components can opt into. This avoids touching the shared Card component.

5. **Component-level padding adjustments** — In dashboard components (`TodaySnapshot`, `TrainingSuggestion`, `WeeklyReview`, `LatestUpdates`), reduce card padding on mobile from `p-4`/`p-6` to `p-3`, use `text-xs`/`text-[10px]` for labels, and `font-mono` for numeric values.

**Phase 5: Typography Refinements**

6. **Dashboard section labels** — Use `font-mono text-[10px] tracking-wider uppercase text-muted-foreground` for section headers (matching the mockup's `.clb` class) instead of the current larger labels.

### What This Does NOT Change
- No database changes
- No route changes  
- No component API changes
- No feature removals
- Desktop layout stays the same
- All existing functionality preserved

### Files to Edit
- `src/pages/Vault.tsx` — mobile header compaction
- `src/components/dashboard/VaultDashboard.tsx` — greeting row
- `src/components/dashboard/TodaySnapshot.tsx` — readiness ring + tile grid redesign
- `src/components/dashboard/TrainingSuggestion.tsx` — compact padding
- `src/components/dashboard/LatestUpdates.tsx` — compact padding  
- `src/components/dashboard/WeeklyReview.tsx` — compact padding
- `src/index.css` — add compact card utility

### Technical Notes
- Readiness ring uses inline SVG with `stroke-dasharray`/`stroke-dashoffset` math (same approach as the mockup)
- Greeting time-of-day logic: before 12 = Morning, before 17 = Afternoon, else Evening
- All density changes use responsive Tailwind classes (`md:p-6 p-3`) so desktop is unaffected

