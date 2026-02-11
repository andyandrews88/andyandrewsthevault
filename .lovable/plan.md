

# Dashboard Content Feed: Fresh Drops + Top Recommendations

## Overview

Add two feed sections to the Vault Dashboard that keep users engaged with Knowledge Bank content:

1. **Fresh Drops** -- automatically shows the 5 most recently added resources/podcasts
2. **Top Recommendations** -- admin-curated picks that you manually select from the Library

## What Changes

### Database

Add a `is_featured` boolean column to the `vault_resources` table (default `false`). When you toggle a resource as "featured" from the Library, it appears in the Top Recommendations section on everyone's dashboard.

Similarly, add `is_featured` to `vault_podcasts`.

No new tables needed -- just a flag on existing content.

### Library Tab (Admin Controls)

When you're logged in as admin, each resource card in the Library will show a small star/pin icon. Clicking it toggles `is_featured` on/off for that resource. Featured items get a subtle highlight so you can see at a glance what's currently promoted.

### Dashboard Feed Component

A new `LatestUpdates.tsx` component on the Dashboard with two sub-sections:

**Top Recommendations (shown first)**
- Fetches all resources/podcasts where `is_featured = true`
- Displayed as compact horizontal cards with type icon, title, category badge, and a CTA button (Watch / Listen / Read)
- Clicking opens the content in the existing `ResourceModal` or external link for podcasts
- Only visible when there are featured items; hidden otherwise

**Fresh Drops (shown second)**
- Fetches the 5 most recently created resources/podcasts (sorted by `created_at` desc), excluding any already shown in Top Recommendations
- Same card format as above, plus a "time ago" label (e.g., "Added 3 days ago")
- "View All" link at the bottom navigates to the Library tab

## Technical Details

### Migration SQL

```sql
ALTER TABLE public.vault_resources ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.vault_podcasts ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
```

### New File: `src/components/dashboard/LatestUpdates.tsx`

- Calls `fetchResources()` and `fetchPodcasts()` from `vaultService.ts`
- Splits items into featured vs. recent
- Renders two sections with shared card sub-component
- Uses `date-fns` `formatDistanceToNow` for time-ago labels
- Reuses `ResourceModal` for inline viewing
- Shows skeleton loaders while fetching

### Modified Files

| File | Change |
|------|--------|
| `src/components/dashboard/VaultDashboard.tsx` | Add `<LatestUpdates />` between `<TrainingSuggestion />` and `<GoalsPanel />` |
| `src/components/vault/LibraryTab.tsx` | Add featured toggle button (star icon) on each resource card when admin |
| `src/components/vault/ResourceCard.tsx` | Add optional `isFeatured` prop and `onToggleFeatured` callback; show star icon for admin |
| `src/lib/vaultService.ts` | Add `toggleResourceFeatured(id, value)` and `togglePodcastFeatured(id, value)` helper functions |
| `src/types/vaultResources.ts` | Add `is_featured` field to `VaultResource` and `VaultPodcast` interfaces |

### Dashboard Layout Order

```
TodaySnapshot
TrainingSuggestion
LatestUpdates (Top Recommendations + Fresh Drops)
GoalsPanel
WeeklyReview
```

