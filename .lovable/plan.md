

## Plan: Full App UI Overhaul — Match Mockup Design Language

This is a systematic visual overhaul across every page and component to match the mockup's compact, data-dense, professional aesthetic. No functionality changes — purely styling and density.

### What Changes

**The core visual gap:** The mockup uses ultra-tight spacing (8-12px card padding), small typography (10-12px body, 7-9px labels), JetBrains Mono for all data/values, minimal card chrome, and a more refined color application. The current app uses standard Tailwind spacing (16-24px padding, 14-16px text) which makes it feel like a prototype rather than a polished product.

### Phase 1: Foundation — Global Primitives (3 files)

**1. `src/components/ui/card.tsx`** — Reduce default padding globally
- CardHeader: `p-6` → `p-3 md:p-4`
- CardContent: `p-6 pt-0` → `p-3 pt-0 md:p-4 md:pt-0`
- CardFooter: `p-6 pt-0` → `p-3 pt-0 md:p-4 md:pt-0`
- CardTitle: `text-2xl` → `text-sm font-semibold`
- CardDescription: `text-sm` → `text-xs`
- Reduce border-radius from `rounded-lg` to `rounded-md`

**2. `src/components/ui/badge.tsx`** — Tighter badges
- Base: `px-2.5 py-0.5 text-xs` → `px-1.5 py-0.5 text-[10px] tracking-wider uppercase font-mono`

**3. `src/components/ui/tabs.tsx`** — Compact tab triggers
- TabsTrigger: reduce to `text-xs px-2.5 py-1.5`
- TabsList: reduce `h-10` → `h-8`

### Phase 2: Global Styles (`src/index.css`)

- Add global mobile-first base font size: `body { font-size: 13px; }` on mobile, 14px on md+
- Add `.section-label` utility: `font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground`
- Add `.value-display` utility: `font-mono text-sm font-semibold`
- Tighten default spacing in `.space-y-6` sections used throughout

### Phase 3: Page-Level Headers (5 files)

Every tab/page currently has a large centered header with Badge + h2 + description paragraph consuming ~120px. Match the mockup: compact left-aligned label + small title, no paragraph on mobile.

**Files:** `WorkoutTab.tsx`, `ProgressTab.tsx`, `Nutrition.tsx`, `NutritionResults.tsx`, `Vault.tsx` (tracks section)
- Badge + h2 + p block → `section-label` + compact `text-base font-semibold` title
- Hide description paragraphs on mobile
- Remove redundant logo displays on sub-pages

### Phase 4: Dashboard Components (4 files)

**`TodaySnapshot.tsx`** — Already redesigned with ring. Fine-tune:
- Metric tiles: ensure `text-[10px]` labels, tighter `p-1.5` padding

**`TrainingSuggestion.tsx`** — Tighten card padding, use section-label style

**`LatestUpdates.tsx`** — Compact list items, mono timestamps

**`WeeklyReview.tsx`** — Compact stats display

### Phase 5: Major Feature Tabs (6 files)

**`WorkoutLogger.tsx`** — Exercise cards, set rows: tighter padding, mono values for weights/reps
**`ExerciseCard.tsx`** — Compact header, smaller text
**`SetRow.tsx`** — Reduce row height, mono inputs

**`ProgressTab.tsx`** — Compact stat cards, smaller chart containers
**`LifestyleTab.tsx` / `DailyCheckin.tsx`** — Tighter form layout

**`LibraryTab.tsx`** + sub-components — Compact resource cards, smaller thumbnails

### Phase 6: Community & Other Sections (3 files)

**`CommunityFeed.tsx`** — Already well-structured, minor density tweaks
**`PostCard.tsx`** — Tighter padding
**`PrivateCoachingPanel.tsx`** — Compact coaching card layout

### Phase 7: Bottom Nav & More Menu (1 file)

**`BottomNav.tsx`** — Already close to mockup. Minor: ensure `text-[10px]` labels, `h-12` bar height

### What This Does NOT Change
- No database changes
- No route changes
- No feature additions or removals
- No component API changes
- Desktop layouts get proportional improvements but mobile is the priority

### Files to Edit (total ~20)
**Primitives:** `card.tsx`, `badge.tsx`, `tabs.tsx`, `index.css`
**Pages:** `Vault.tsx`, `Nutrition.tsx`
**Dashboard:** `TodaySnapshot.tsx`, `TrainingSuggestion.tsx`, `LatestUpdates.tsx`, `WeeklyReview.tsx`, `VaultDashboard.tsx`
**Features:** `WorkoutTab.tsx`, `WorkoutLogger.tsx`, `ExerciseCard.tsx`, `SetRow.tsx`, `ProgressTab.tsx`, `DailyCheckin.tsx`, `LibraryTab.tsx`
**Other:** `BottomNav.tsx`, `PostCard.tsx`, `PrivateCoachingPanel.tsx`, `NutritionResults.tsx`

### Approach
Changes are applied bottom-up: primitives first (card, badge, tabs) so that every component using them gets tighter automatically, then page-level headers, then component-specific refinements. This minimizes the number of individual component edits needed.

