

# Remove Redundant Nutrition Tab from Vault

## Current State

The Vault has a **Nutrition tab** that contains:
1. A promotional card linking to `/nutrition`
2. A Food Database browser

Meanwhile, the standalone `/nutrition` page has:
- The actual Nutrition Calculator
- Results display

This creates a fragmented experience where users click a tab, then have to click another link to access the real tool.

---

## Recommendation

**Remove the Nutrition tab from the Vault entirely** since:
- The standalone `/nutrition` page is the primary destination
- Users can access it directly from the main navbar
- The Food Database component could be integrated into the `/nutrition` page if needed

---

## Changes Required

### 1. Remove Nutrition Tab from Vault (src/pages/Vault.tsx)

- **Remove the tab trigger** (lines 75-78)
- **Remove the tab content** (lines 115-139)
- **Remove unused imports**: `Calculator`, `FoodDatabase`, and potentially `Link` if no longer needed

### 2. Optional: Enhance Standalone Nutrition Page

If you want the Food Database accessible from the nutrition page, I can add it there as a collapsible section or separate tab within that page.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Vault.tsx` | Remove Nutrition tab trigger and content, clean up imports |

---

## Result

After this change, the Vault tabs will be:
- Library
- Progress
- Workouts
- Podcast
- Community
- Tracks
- Admin (if applicable)

Users access nutrition tools via the main navbar link to `/nutrition`.

---

## Optional Enhancement

Would you like me to also add the Food Database to the standalone `/nutrition` page? This would consolidate all nutrition features in one place:
- Nutrition Calculator (existing)
- Results Display (existing)  
- Food Database (moved from Vault)

Let me know if you want this addition included in the implementation.

