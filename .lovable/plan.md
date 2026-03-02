

# Plan: Collapsible & Reorderable Dashboard Sections

## Overview

Make both the **Client Dashboard** (VaultDashboard) and **Admin User Profile** sections collapsible and reorderable. Each section gets a collapse toggle, and sections can be moved up/down to customize layout. Order and collapse state persist in localStorage.

## Approach

No drag-and-drop library needed — a clean up/down arrow UI is more reliable and mobile-friendly. Each section is wrapped in a reusable `CollapsibleDashboardSection` component.

## New Component: `CollapsibleDashboardSection`

Location: `src/components/ui/CollapsibleDashboardSection.tsx`

A wrapper that provides:
- **Collapse toggle** — chevron icon that expands/collapses the section content with smooth animation
- **Reorder buttons** — small up/down arrow buttons (visible on hover or via an "edit layout" toggle) to move sections
- **Header area** — renders the section title/badge as-is

Props: `id`, `title`, `icon?`, `badge?`, `children`, `defaultOpen?`, `onMoveUp?`, `onMoveDown?`, `isFirst?`, `isLast?`

## New Hook: `useDashboardLayout`

Location: `src/hooks/useDashboardLayout.ts`

A small hook using localStorage (or zustand) to persist:
- **Section order** — array of section IDs
- **Collapsed state** — map of section ID → boolean
- **Helper functions** — `moveUp(id)`, `moveDown(id)`, `toggleCollapse(id)`, `isCollapsed(id)`

Uses a unique storage key per dashboard (e.g. `vault-dashboard-layout`, `admin-profile-layout`).

## Changes to `VaultDashboard.tsx`

Wrap each widget (AnnouncementBanner, TodaySnapshot, TrainingSuggestion, LatestUpdates, GoalsPanel, WeeklyReview) in `CollapsibleDashboardSection`. Render sections in order from the layout hook. Add an "Edit Layout" toggle button in the header area that shows/hides the reorder arrows.

Sections (5 items):
| ID | Title |
|----|-------|
| `snapshot` | Today's Snapshot |
| `training` | Training Suggestion |
| `updates` | Latest Updates |
| `goals` | Goals |
| `review` | Weekly Review |

AnnouncementBanner stays pinned at top (not reorderable).

## Changes to `AdminUserProfile.tsx`

Same pattern. Each major section becomes a collapsible, reorderable block. Add "Edit Layout" toggle near the page header.

Sections (~10 items):
| ID | Title |
|----|-------|
| `stats` | Stats Summary |
| `readiness` | Readiness & Lifestyle |
| `ai-report` | AI Client Report |
| `compliance` | Program Compliance |
| `training` | Training |
| `pt-tracker` | PT Session Tracker |
| `checkins` | Check-in History |
| `goals` | Goals |
| `nutrition` | Nutrition |
| `community` | Community |
| `body-entries` | Body Entries |
| `messages` | Private Message |
| `analytics` | Coaching Analytics |
| `performance` | Performance Report |
| `notes` | Coaching Notes |

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/ui/CollapsibleDashboardSection.tsx` | **New** — Reusable collapsible + reorderable section wrapper |
| `src/hooks/useDashboardLayout.ts` | **New** — Persists section order and collapse state to localStorage |
| `src/components/dashboard/VaultDashboard.tsx` | Wrap widgets in collapsible sections, render by stored order |
| `src/pages/AdminUserProfile.tsx` | Wrap all sections in collapsible sections, render by stored order |

No database changes needed — layout preferences stored client-side in localStorage.

