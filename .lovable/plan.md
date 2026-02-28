

# Four-Part Enhancement: Client Dashboard, Sleep Hours, Per-Client AI, Briefing Cleanup

---

## 1. Enrich Client Dashboard (AdminUserProfile)

The current `AdminUserProfile.tsx` shows training, check-ins, goals, nutrition (basic), community, and body entries but is missing:
- **Food diary data** (daily logging history)
- **Readiness trend visualization** (chart of readiness scores over time)
- **Program enrollment info** (what program they're on, compliance %)
- **Lifestyle summary cards** (avg sleep, energy, stress, drive as visual stat cards)

### Changes:

**`supabase/functions/admin-user-profile/index.ts`**
- Add parallel queries for `user_food_diary` (last 30 entries), `user_program_enrollments` + `programs` (name), `user_calendar_workouts` (compliance calc)
- Return `foodDiary`, `programEnrollments`, `calendarCompliance` in the response

**`src/pages/AdminUserProfile.tsx`**
- Add a **Readiness** stat card row showing avg Sleep/Energy/Stress/Drive as colored cards (like the existing 5-stat row)
- Add a **Readiness Trend** mini chart (last 30 check-ins, line chart with sleep_hours + readiness %)
- Add a **Program Compliance** section showing enrolled programs + completion %
- Add a **Food Diary** section showing recent diary entries count and a summary
- Reorder sections: Header → Stats → Readiness → Training → Programs → Nutrition (enriched) → Lifestyle → Body → Community → Messages → Analytics → Notes

---

## 2. Add Sleep Hours to Daily Check-in + Matthew Walker Readiness Logic

### Database Migration
Add `sleep_hours` column to `user_daily_checkins`:
```sql
ALTER TABLE public.user_daily_checkins ADD COLUMN sleep_hours numeric NULL;
```

### Matthew Walker Readiness Formula
Based on Walker's research: adults need 7-9 hours. The formula weights sleep hours heavily:
- Sleep Hours Score: <5h = 1, 5-6h = 2, 6-7h = 3, 7-8h = 4, 8+ = 5
- **New Readiness** = (sleep_hours_score × 2 + sleep_quality + energy + drive + (6 - stress)) / 7 × 100
- Sleep hours gets double weight per Walker's emphasis on sleep quantity as the foundation

### Changes:

**`src/components/lifestyle/DailyCheckin.tsx`**
- Add a `sleep_hours` numeric input field (slider or stepper, 0-14 range, 0.5 increments) before the existing metrics
- Update `CheckinData` interface to include `sleep_hours`
- Update `readinessScore()` to use the Walker-weighted formula
- Display the sleep hours in the submitted view

**`supabase/functions/admin-user-profile/index.ts`** and **`supabase/functions/admin-intelligence/index.ts`**
- Include `sleep_hours` in check-in queries for richer analysis

---

## 3. Per-Client AI Report

### New Edge Function: `supabase/functions/admin-client-report/index.ts`
- Takes `userId` as input
- Fetches all data for that specific user (same data as `admin-user-profile` but formatted as an AI prompt)
- Sends to Lovable AI (google/gemini-3-flash-preview) with a client-focused system prompt
- Report structure:
  1. Client Overview & Engagement Status
  2. Training Analysis (volume trends, frequency, PRs, consistency)
  3. Readiness & Recovery (sleep hours, energy, stress patterns, burnout risk)
  4. Nutrition Compliance (calculator, diary, meals)
  5. Goal Progress Assessment
  6. Body Composition Trends
  7. Community Engagement
  8. Coaching Recommendations (5 specific actions)
  9. Risk Assessment (🟢/🟡/🔴 rating with explanation)

### New Component: `src/components/admin/ClientAIReport.tsx`
- Similar to `AIIntelligenceBriefing` but for a single client
- "Generate Client Report" button
- Renders with ReactMarkdown
- Collapsible sections for clean reading

### Integration into `AdminUserProfile.tsx`
- Add `ClientAIReport` component after the stats summary, before the training section
- Pass `userId` and `displayName` as props

---

## 4. Clean Up AI Intelligence Briefing Formatting

The current report renders as a wall of text (visible in the screenshot). Issues:
- No visual separation between sections
- Headers don't stand out
- The Client Priority Matrix needs colored indicators
- No spacing between sections

### Changes to `src/components/admin/AIIntelligenceBriefing.tsx`:
- Replace single `ReactMarkdown` block with **section-based rendering**: parse the markdown by `## ` headers and render each section in its own collapsible `Card`
- Add colored left-border accents per section type (e.g., blue for training, green for nutrition, purple for AI recommendations)
- Style the Client Priority Matrix: parse 🟢/🟡/🔴 lines and render as colored Badge components
- Add a table of contents / section nav at the top for quick jumping
- Wrap the entire report in a `ScrollArea` with proper spacing

### Changes to the system prompt in `admin-intelligence/index.ts`:
- Add instruction to use `---` between sections for easier parsing
- Ensure consistent formatting of the priority matrix as a table

---

## Files to Create
| File | Purpose |
|------|---------|
| `supabase/functions/admin-client-report/index.ts` | Per-client AI analysis |

## Files to Modify
| File | Changes |
|------|---------|
| `src/components/lifestyle/DailyCheckin.tsx` | Add sleep_hours input + Walker readiness formula |
| `supabase/functions/admin-user-profile/index.ts` | Add food diary, programs, sleep_hours to response |
| `supabase/functions/admin-intelligence/index.ts` | Include sleep_hours, improve prompt formatting |
| `src/pages/AdminUserProfile.tsx` | Add readiness cards, program compliance, food diary, ClientAIReport |
| `src/components/admin/AIIntelligenceBriefing.tsx` | Section-based rendering with cards, colored indicators, TOC |
| `src/components/admin/ClientAIReport.tsx` | New per-client AI report component |

## Database Migration
- Add `sleep_hours` column to `user_daily_checkins`

