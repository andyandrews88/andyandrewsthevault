

# Rebrand to "The Vault" + Remove Wearables + Mobile UI Audit

## Overview

This plan addresses three key changes:
1. **Rebrand**: Change the opening page name to "The Vault" with slogan "Performance Architect"
2. **Remove Wearables**: Remove smartwatch integration (temporary - can restore later)
3. **Mobile UI Audit**: Fix cramped layouts across all screens

---

## Part 1: Rebranding to "The Vault"

### Changes to Opening Page (Landing/Hero)

| Location | Current | New |
|----------|---------|-----|
| Browser tab | Uses current title | "The Vault - Performance Architect" |
| Hero headline | "Performance Architecture." | "The Vault" with subheading "Performance Architect" |
| Badge | "SYSTEM ONLINE" | "PERFORMANCE ARCHITECT" |
| CTA button | "Begin Structural Audit" | Keep or update to "Enter The Vault" |
| Footer | "The Vault" (already correct) | Keep as is |

### Files to Modify

- `index.html` - Update page title and meta description
- `src/components/landing/HeroSection.tsx` - Rebrand headline and badge
- `src/components/layout/Navbar.tsx` - Optional: Update logo alt text

### Hero Section New Layout

```text
+------------------------------------------+
|              [LOGO IMAGE]                |
|                                          |
|      [ PERFORMANCE ARCHITECT badge ]     |
|                                          |
|              THE VAULT                   |
|        Performance Architecture          |
|                                          |
|    6-Time Fittest Man in Sri Lanka...    |
|                                          |
|   [Begin Audit]  [Access The Vault]      |
+------------------------------------------+
```

---

## Part 2: Remove Wearable Integration (Temporary)

### What Gets Removed

- **WearableConnect.tsx component** - The device connection UI
- **Wearable section from ProgressTab** - Hide the connected devices card
- **Database tables stay intact** - Keep `user_wearable_connections` and `user_wearable_data` tables for future use

### What Stays

- All body composition tracking functionality
- Weight charts, measurement tables, body scans
- Progress overview cards
- The database schema (for when you're ready to restore wearables)

### Files to Modify

- `src/components/progress/ProgressTab.tsx` - Remove WearableConnect import and usage
- `src/types/progress.ts` - Keep wearable types (for future restoration)

### Restoration Path

When you're ready to add wearables back:
1. Simply uncomment the WearableConnect import
2. Add the component back to ProgressTab
3. All types and database structure will still be in place

---

## Part 3: Mobile UI Audit & Fixes

### Identified Issues

| Component | Problem | Fix |
|-----------|---------|-----|
| **Navbar** | Mobile menu items have decent spacing but could be improved | Increase padding, add visual separators |
| **Vault Tabs** | 6-7 tabs crammed on small screens, icons only with hidden labels | Stack tabs vertically or use horizontal scroll |
| **Progress Overview Cards** | 2x2 grid is tight on mobile | Single column on mobile, 2 columns on tablet |
| **ProgressTab inner tabs** | 3 tabs with tiny icons, hidden labels | Larger touch targets |
| **BodyEntryForm** | Form fields cramped, popup calendar hard to use | More vertical spacing, full-width calendar |
| **Hero Stats** | 3-column layout gets tight | Vertical stack on small screens |
| **Category Filters (Library)** | Buttons wrap awkwardly | Horizontal scroll or dropdown on mobile |
| **Wearable Device Grid** | 4 columns too dense on mobile | Already using 1 column on mobile, but cards are cramped |

### Detailed Fixes

#### 1. Vault Main Tabs (Vault.tsx)

Current issue: 6-7 tabs in a grid that shows only icons on mobile

**Fix**: Use a scrollable horizontal tab list with visible labels

```text
Mobile Current:                    Mobile Fixed:
+--+--+--+--+--+--+--+            +------------------------+
|📚|📊|🍎|🎧|👥|🎯|⚙️|            | 📚 Library | 📊 Progress | ...→
+--+--+--+--+--+--+--+            +------------------------+
                                   (horizontally scrollable)
```

#### 2. Progress Overview Cards (ProgressOverview.tsx)

Current: `grid-cols-2 md:grid-cols-4` on all screens

**Fix**: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` with improved card padding

#### 3. Hero Section Stats (HeroSection.tsx)

Current: `flex gap-12` which squishes on small screens

**Fix**: `flex flex-col sm:flex-row gap-6 sm:gap-12` to stack vertically on mobile

#### 4. Body Entry Form (BodyEntryForm.tsx)

Current: Cramped 2-column grids

**Fix**: 
- Single column on mobile for all form sections
- Larger input fields with more vertical spacing
- Full-width date picker button

#### 5. Category Filters (CategoryFilter.tsx)

Current: Wrapping buttons that look messy

**Fix**: Horizontal scroll container with gradient fade edges

#### 6. Library Resource Grid (LibraryTab.tsx)

Current: `sm:grid-cols-2 lg:grid-cols-3` starts 2-column too early

**Fix**: `md:grid-cols-2 lg:grid-cols-3` for more breathing room

#### 7. Podcast Episode Grid (PodcastTab.tsx)

Current: Same grid issue as Library

**Fix**: Same responsive breakpoint adjustment

### Mobile Spacing Standards

Applying consistent spacing throughout:

| Element | Mobile Padding | Desktop Padding |
|---------|---------------|-----------------|
| Page container | `px-4` | `px-6` |
| Card content | `p-4` | `p-6` |
| Form groups | `space-y-4` | `space-y-6` |
| Touch targets | min 44px height | Standard |

---

## Files to Create/Modify

| File | Changes |
|------|---------|
| `index.html` | Update title to "The Vault - Performance Architect" |
| `src/components/landing/HeroSection.tsx` | Rebrand headline, badge, mobile stat layout |
| `src/pages/Vault.tsx` | Fix tab navigation for mobile (horizontal scroll) |
| `src/components/progress/ProgressTab.tsx` | Remove WearableConnect, fix inner tab layout |
| `src/components/progress/ProgressOverview.tsx` | Better mobile grid |
| `src/components/progress/BodyEntryForm.tsx` | Single-column mobile, larger touch targets |
| `src/components/vault/CategoryFilter.tsx` | Horizontal scroll container |
| `src/components/vault/LibraryTab.tsx` | Adjust grid breakpoints |
| `src/components/vault/PodcastTab.tsx` | Adjust grid breakpoints |

---

## Implementation Order

1. **Rebrand first** - Quick visual change to see "The Vault" branding
2. **Remove wearables** - Simple removal, keeps code clean
3. **Mobile fixes** - Systematic component-by-component improvements

---

## Technical Notes

### Tab Scroll Implementation

For the Vault tabs horizontal scroll:

```text
<div className="overflow-x-auto scrollbar-hide">
  <TabsList className="flex w-max min-w-full gap-1">
    {/* tabs with visible labels */}
  </TabsList>
</div>
```

### Preserving Wearable Code

The wearable types and database schema remain in place. To restore:
- Types in `src/types/progress.ts` - kept
- Database tables - kept (no migrations to reverse)
- Component file `WearableConnect.tsx` - kept but unused
- Just needs re-import when ready

