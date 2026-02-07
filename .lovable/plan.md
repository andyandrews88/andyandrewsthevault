
# HPA Training Podcast Integration

## Overview
Add a dedicated **Podcast** tab to The Vault dashboard, showcasing the HPA Training Podcast with featured episodes, a direct link to Apple Podcasts, and topic-based filtering.

---

## Current Vault Structure (3 Tabs)
1. Library - Movement Blueprints
2. Community - Text-based feed
3. Tracks - Foundation/Performance programs

## New Vault Structure (4 Tabs)
1. Library - Movement Blueprints
2. **Podcast** (NEW) - HPA Training Podcast episodes
3. Community - Text-based feed
4. Tracks - Foundation/Performance programs

---

## Podcast Tab Design

### Header Section
- Podcast title: "HPA Training Podcast"
- Tagline: "Health, Performance & Aesthetics"
- Episode count badge: "27 EPISODES"
- "Listen on Apple Podcasts" button linking to the full podcast page

### Featured Episode Card
- Highlight the latest episode ("We are rebranding" - Jan 30, 2025)
- Large play icon with episode duration
- Direct link to Apple Podcasts episode

### Episode Grid
Curated selection of episodes organized by topic relevance to The Vault:

| Episode | Duration | Topic Category |
|---------|----------|----------------|
| Secret to Motivation | 20 min | Mindset |
| Tracking the Right Metrics | 14 min | Data & Progress |
| Decision Fatigue & Food Prep | 10 min | Nutrition |
| How to Make Progress in the Gym | 10 min | Training |
| The Goldilocks Zone | 2 min | Training |
| Worlds Best Program | 9 min | Onboarding |

### Episode Card Design
Each card includes:
- Headphone/podcast icon (using Lucide `Headphones` or `Mic` icon)
- Episode title
- Duration in monospace font
- Category badge
- External link to Apple Podcasts episode

---

## Technical Details

### Mock Data Structure
```text
const podcastEpisodes = [
  {
    id: 1,
    title: "We are rebranding",
    description: "Welcome to HPA Podcast - reimagined for Health, Performance & Aesthetics",
    duration: "3 min",
    date: "01/30/2025",
    category: "Announcement",
    url: "https://podcasts.apple.com/us/podcast/we-are-rebranding/id1538797196?i=1000687131996",
    featured: true
  },
  // ... more episodes
];
```

### New Icons Required
- `Headphones` or `Mic` from lucide-react for podcast episodes
- `Radio` for the tab icon

### UI Components
- Existing `Card`, `Badge`, `Button` components
- New tab in `TabsList` with 4 columns instead of 3

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Vault.tsx` | Add podcast episodes data, add Podcast tab trigger, add Podcast TabsContent with episode grid and Apple Podcasts link |

---

## Visual Design Notes

- Maintain "Industrial-Elite" dark mode aesthetic
- Featured episode gets a larger card with accent border
- Episode cards use the same interactive card style as resources
- Duration displayed in monospace font for data consistency
- External links open in new tab with `ExternalLink` icon
- Category badges use existing badge variants

---

## Key Links

- Main Podcast: `https://podcasts.apple.com/us/podcast/hpa-training-podcast/id1538797196`
- Individual episodes link directly to their Apple Podcasts pages
