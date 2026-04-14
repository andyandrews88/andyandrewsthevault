

## Plan: Program Landing Pages

### What This Does
Each program card in Tracks will link to a dedicated landing page (`/program/:slug`) with a hero video, full description, program details, and an enroll button. Admins get inline editing for the landing page content.

### Database Change
Add a `long_description` text column to the `programs` table for rich landing page content (the existing `description` stays as the short card blurb).

```sql
ALTER TABLE public.programs ADD COLUMN long_description text DEFAULT '';
```

### Files to Create

**1. `src/pages/ProgramLanding.tsx`** — New landing page route
- Fetches program by slug from URL param
- Hero section: embedded YouTube video (using existing URL transform util), program name, badges (difficulty, duration, category)
- Full description section (`long_description` with markdown or plain text)
- Program details sidebar/section: days/week, duration, difficulty, style
- "Enroll Now" CTA button (opens the existing `ProgramAssignmentWizard`)
- If already enrolled, shows "Currently Enrolled" status
- Admin edit button (visible only to admins via `useAdminCheck`)

**2. `src/components/tracks/ProgramLandingEditor.tsx`** — Admin inline editor
- Appears as a drawer/dialog when admin clicks "Edit Landing Page"
- Fields: long description (textarea), video URL, description (short), and all existing program fields
- Saves directly to the `programs` table

### Files to Edit

**3. `src/App.tsx`**
- Add route: `<Route path="/program/:slug" element={<ProtectedRoute><ProgramLanding /></ProtectedRoute>} />`

**4. `src/components/tracks/ProgramCard.tsx`**
- Change card click / "Select Program" button behavior: navigate to `/program/${program.slug}` instead of directly opening the enrollment wizard
- Keep "Enrolled" badge for enrolled programs, but make it also navigate to the landing page

**5. `src/stores/programStore.ts`**
- Add `long_description` to the `Program` interface
- Add `fetchProgramBySlug` method that fetches a single program by slug

**6. `src/components/admin/ProgramAdmin.tsx`**
- Add `long_description` textarea field to the existing `ProgramEditor` component (below the current description field)
- Label it "Landing Page Description" with helper text

### Landing Page Layout (mobile-first)
```text
┌─────────────────────────┐
│  ◄ Back to Programs     │
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │   YouTube Embed   │  │
│  │   (16:9 ratio)    │  │
│  └───────────────────┘  │
│                         │
│  PROGRAM NAME           │
│  [Intermediate] [12wk]  │
│  [Strength] [4d/week]   │
│                         │
│  ─── About ───          │
│  Long description text  │
│  ...                    │
│                         │
│  ─── Details ───        │
│  Duration: 12 weeks     │
│  Days/week: 4           │
│  Style: Wendler 5/3/1   │
│                         │
│  [  Enroll Now  ]       │
│  (or "Enrolled ✓")     │
│                         │
│  ✏️ Edit (admin only)   │
└─────────────────────────┘
```

### Technical Notes
- Video embedding reuses the existing YouTube/Vimeo URL transform logic already in the codebase
- No new tables needed — just one column addition
- The enrollment wizard is reused as-is from `ProgramAssignmentWizard`

