

## Plan: Replace Top Nav with "More" Bottom Nav Tab

### Problem
On mobile, there's a redundant top navbar alongside the bottom nav. The user wants the top nav removed entirely on mobile and a "More" icon added to the bottom nav that opens a grid-style bottom sheet with all extra options.

### What Changes

**1. Update `src/lib/navigationConstants.ts`**
- Replace "Library" in `BOTTOM_NAV_TABS` with a "More" entry (using `MoreHorizontal` icon)
- Add a new `MORE_MENU_ITEMS` array defining the grid items: Admin (admin-only), Lifestyle, Nutrition, Community, Library, Podcast, Tracks, Profile, Settings, Sign Out

**2. Redesign `src/components/layout/BottomNav.tsx`**
- Add a "More" button as the 5th tab that opens a bottom sheet instead of switching tabs
- The bottom sheet displays a 3-column grid of icon cards (matching the reference screenshot style — dark cards with outlined icons and labels)
- Grid items: Admin (if admin), Lifestyle, Nutrition (navigates to `/nutrition`), Community, Library, Podcast, Tracks, Profile (navigates to `/profile`), Settings (navigates to `/profile`)
- Each grid item either switches vault tabs (via `onTabChange`) or navigates to standalone routes (via `useNavigate`)
- Sign Out as a full-width destructive button at the bottom

**3. Update `src/pages/Vault.tsx`**
- Remove the horizontal top tab strip entirely on mobile (keep it for desktop)
- The top tab strip currently handles switching between dashboard/workouts/library/progress/lifestyle/podcast/community/tracks/admin — on mobile, this is now handled by the bottom nav + More sheet

**4. Remove mobile Navbar completely**
- `VaultPage.tsx` already hides Navbar on mobile — confirm the top bar in the screenshot is the Vault.tsx header, not Navbar
- Hide the horizontal `TabsList` on mobile in Vault.tsx (wrap with `hidden md:flex`)

### Files to Edit
1. `src/lib/navigationConstants.ts` — add More menu items config
2. `src/components/layout/BottomNav.tsx` — add More button + grid bottom sheet
3. `src/pages/Vault.tsx` — hide top tab strip on mobile

### Routing Verification
Every "More" grid item will map to either:
- A vault tab change (`onTabChange("lifestyle")`) for in-vault sections
- A `navigate("/nutrition")` or `navigate("/profile")` for standalone pages
- No dead links — all routes already exist in the app router

