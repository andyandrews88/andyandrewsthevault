

# The Vault - Premium Engineering-Grade Resource Hub

## Overview

This plan transforms the existing Vault implementation into a comprehensive, engineering-grade Knowledge Hub that productizes Andy Andrews' expertise. The current foundation is solid - we'll enhance it with a dynamic content system, tighter audit-to-resource mapping, and a premium member experience.

---

## Current State Analysis

**What's Already Built:**
- Vault dashboard with 4 tabs (Library, Podcast, Community, Tracks)
- Structural Integrity Audit with leak detection logic
- Results page with radar charts and leak recommendations
- Auth page (simulated, no backend)
- Industrial-Elite dark mode aesthetic
- HPA Podcast integration with Apple Podcasts links

**What Needs Enhancement:**
- Dynamic content system supporting multiple media types
- Category tagging system (Physics, Physiology, Process)
- Audit-to-resource intelligent mapping
- Full Archive for premium members
- Secure authentication with subscription management

---

## Implementation Architecture

### Phase 1: Dynamic Knowledge Bank

**Content Type System:**
The resource library will support multiple embed types with a unified card interface.

| Content Type | Source | Display |
|--------------|--------|---------|
| Video | YouTube/Vimeo | Embedded player in modal |
| Podcast | Spotify/Apple | Embedded player widget |
| Article | Markdown | Rendered content view |
| PDF | Stored file | Download/viewer |

**Category Tagging System:**

```text
Categories:
- PHYSICS: Biomechanics, movement patterns, force production
- PHYSIOLOGY: Energy systems, recovery, adaptation
- PROCESS: Programming, periodization, lifestyle
```

Each resource gets tagged with a primary category plus optional "leak mapping" tags that connect to audit results.

**New Resource Data Structure:**
```text
{
  id: string,
  title: string,
  description: string,
  type: 'youtube' | 'vimeo' | 'spotify' | 'apple_podcast' | 'article' | 'pdf',
  embedUrl?: string,
  content?: string (markdown for articles),
  category: 'physics' | 'physiology' | 'process',
  leakTags: string[] (e.g., ['aerobic-power', 'thoracic-core']),
  duration?: string,
  isPremium: boolean,
  createdAt: string
}
```

### Phase 2: Audit-to-Resource Mapping

**Intelligent Recommendations:**
When users complete the audit, the results page will display personalized resource recommendations based on their detected leaks.

| Leak Type | Recommended Resources |
|-----------|----------------------|
| Aerobic Power | Zone 2 Protocol (PDF), Aerobic Power podcast episodes |
| Thoracic/Core Stability | Core Stability Series (Video), Front Rack Mobility (Video) |
| Pressing Strength | Pressing Progression (Video), Overhead Strength article |
| Posterior Chain | Deadlift Position Guide (PDF), Hip Hinge Mastery (Video) |
| Systemic Recovery | Recovery Protocol (Article), Stress Management podcast |

The results page will show a "Recommended for You" section with 3-5 targeted resources based on leak analysis.

### Phase 3: Enhanced Library Interface

**Redesigned Library Tab:**
- Category filter tabs (All / Physics / Physiology / Process)
- Content type filter (Video / Podcast / Article)
- Search functionality
- Card grid with type-specific icons and badges
- Premium content lock indicator for non-members
- Modal viewer for embedded content

**Content Card Design:**
```text
+----------------------------------+
| [Category Badge]        [Type]   |
|                                  |
| Title                            |
| Description (2 lines max)        |
|                                  |
| Duration: 12:34    [Premium 🔒]  |
+----------------------------------+
```

### Phase 4: Premium Member Experience

**Membership Tiers:**
```text
FREE (Audit Users):
- Structural Integrity Audit access
- 3 sample resources per category
- Results with recommendations (locked)

VAULT MEMBER ($49/mo):
- Full Archive: All resources unlocked
- The Roadmap: CoachRx track links
- Community Hub: Full access
- 1-on-1 coaching application (if tier qualifies)
```

**The Full Archive Section:**
New tab or section showing complete resource count and categorized deep-dives.

**The Roadmap Section:**
Enhanced Tracks tab with:
- Direct CoachRx links for Foundation and Performance
- Track recommendation based on audit tier
- Progress tracking placeholder (for future)

### Phase 5: Backend Requirements (Lovable Cloud)

**To fully implement, the following needs enabling:**

1. **Authentication (Supabase Auth)**
   - Email/password sign-in
   - Email confirmation flow
   - Session management

2. **Database Tables**
   ```text
   resources:
     - id, title, description, type, embed_url, content
     - category, leak_tags, duration, is_premium, created_at
   
   user_profiles:
     - id, user_id (FK), display_name, avatar_url
     - subscription_status, subscription_tier
   
   community_posts:
     - id, user_id, content, created_at
   
   audit_results:
     - id, user_id, data (JSONB), created_at
   ```

3. **Stripe Integration**
   - $49/mo subscription product
   - Webhook for subscription status updates
   - Customer portal for management

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/types/resources.ts` | Create | Type definitions for resources, categories |
| `src/data/resources.ts` | Create | Mock resource data with full content |
| `src/components/vault/LibraryTab.tsx` | Create | Redesigned library with filters |
| `src/components/vault/ResourceCard.tsx` | Create | Unified content card component |
| `src/components/vault/ResourceModal.tsx` | Create | Modal for viewing embedded content |
| `src/components/vault/CategoryFilter.tsx` | Create | Filter UI for categories |
| `src/components/audit/ResultsPage.tsx` | Modify | Add recommended resources section |
| `src/pages/Vault.tsx` | Modify | Update to use new library component |
| `src/stores/auditStore.ts` | Modify | Add resource mapping logic |

---

## UI/UX Enhancements

**Visual Hierarchy:**
- Category badges use distinct colors:
  - Physics: Primary cyan (`badge variant="data"`)
  - Physiology: Success green (`badge variant="success"`)
  - Process: Accent gold (`badge variant="elite"`)

**Content Type Indicators:**
- YouTube/Vimeo: Play icon with red/blue accent
- Spotify: Green audio wave icon
- Apple Podcast: Purple podcast icon
- Article: FileText icon
- PDF: Download icon

**Premium Lock State:**
- Greyed overlay with lock icon
- "Join The Vault to unlock" tooltip
- Clicking routes to /auth

---

## Sample Resource Data

```text
Resources to include:

PHYSICS (Movement Blueprints):
- Back Squat Mechanics (YouTube)
- Front Rack Mobility (Vimeo)
- Deadlift Position Guide (PDF)
- Hip Hinge Mastery (YouTube)

PHYSIOLOGY (Engine & Recovery):
- Zone 2 Protocol (PDF + Article)
- Aerobic Power Deep-Dive (Podcast)
- Recovery Protocol (Article)
- Stress Management Guide (Podcast)

PROCESS (Programming & Lifestyle):
- Periodization Principles (Article)
- Decision Fatigue & Nutrition (Podcast)
- Foundation Track Overview (Video)
- Performance Track Strategy (Video)
```

---

## Implementation Order

1. **Create type definitions and mock data** - Establish the content structure
2. **Build ResourceCard component** - Unified card with type detection
3. **Build ResourceModal component** - Embedded viewer for videos/podcasts
4. **Create LibraryTab with filters** - Category and type filtering
5. **Update Vault.tsx** - Integrate new library
6. **Update ResultsPage.tsx** - Add personalized recommendations
7. **Add premium lock states** - Visual indicators for non-members

---

## Technical Notes

- Embedded content uses iframe with responsive aspect ratio (16:9 for video, custom for podcasts)
- Spotify embeds use `https://open.spotify.com/embed/episode/{id}`
- Apple Podcast embeds use native links (no embed API) - open in new tab
- YouTube embeds use `https://www.youtube.com/embed/{id}`
- Markdown articles rendered with basic styling (no external library needed)
- All mock data can be migrated to Supabase database when backend is enabled

