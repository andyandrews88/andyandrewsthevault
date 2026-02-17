
# Fix Anonymous Names, Flexible Audit, and AI Results Recap

## Overview

Four fixes addressing: (1) users showing as "Anonymous" everywhere, (2) admin dashboard also showing "Anonymous", (3) audit requiring metrics users may not have, and (4) audit results lacking a personalized written review.

---

## Issue 1 & 2: Anonymous Names (Community + Dashboard)

**Root Cause:** The `signUp` function in `authStore.ts` accepts a `name` parameter from the signup form but never passes it to the auth API. The database trigger `handle_new_user_profile` tries to read `raw_user_meta_data->>'full_name'` which is always null, so every user gets "Anonymous".

**Fix:**
- Update `authStore.ts` `signUp` method to include `data: { full_name: name }` in the `options` passed to `supabase.auth.signUp()`
- Write a one-time database migration to backfill existing "Anonymous" profiles using the email prefix (everything before the @) as a fallback display name
- Existing users who already have profiles will get updated; new signups will work correctly going forward

**Backfill migration:**
```sql
UPDATE public.user_profiles
SET display_name = split_part(
  (SELECT email FROM auth.users WHERE auth.users.id = user_profiles.id),
  '@', 1
)
WHERE display_name = 'Anonymous';
```

---

## Issue 3: Flexible Audit Inputs

**Problem:** The audit currently requires exact 1RM numbers for Back Squat, Front Squat, Strict Press, Deadlift, and a precise mile time. Many users won't know these.

**Solution -- make strength/engine fields optional with alternatives:**

### Strength Step Changes
- Each of the 4 lifts becomes optional (remove validation requiring them)
- Add an "I don't know my 1RM" toggle per lift that reveals an **estimated 1RM calculator**: user enters weight used and reps completed, and we calculate estimated 1RM using the Epley formula: `weight x (1 + reps/30)`
- Add a "Skip this movement" option that excludes it from the analysis entirely
- Allow users to substitute movements (e.g., swap Front Squat for Goblet Squat, swap Deadlift for Trap Bar Deadlift) via a dropdown -- the ratios adjust accordingly

### Engine Step Changes
- Make mile run optional
- Add alternative cardio tests: 2K Row, 500m Row, 2000m Bike Erg, or "I don't have a cardio benchmark"
- Each alternative maps to an equivalent aerobic capacity score

### Store/Logic Changes
- Update `AuditData` interface to make strength and engine fields optional (using `?`)
- Add new fields: `estimatedLifts` (object tracking which lifts used estimation), `substitutions` (which movements were swapped), `cardioTest` (which test was used)
- Update `detectLeaks()` to skip analysis for missing data points and note which areas couldn't be assessed
- Update `calculateScores()` to handle partial data -- score only what's available and clearly mark gaps
- Update validation in `AuditForm` to only require biometrics (weight, age, height) and lifestyle questions

### Additional Audit Questions (Lifestyle Step)
Add these to gather a richer picture for the AI recap:

- **Training frequency**: "How many days per week do you train?" (1-2, 3-4, 5-6, 7)
- **Primary training goal**: "What's your main focus?" (Strength, Conditioning, Body Composition, Sport Performance, General Health)
- **Injury history**: "Do you have any current injuries or limitations?" (None, Upper body, Lower body, Back/Spine, Multiple)
- **Water intake**: "How much water do you drink daily?" (Less than 1L, 1-2L, 2-3L, 3L+)
- **Alcohol consumption**: "How often do you consume alcohol?" (Never, 1-2x/week, 3-4x/week, Daily)

These go into the `AuditData` interface and get passed to the AI for the recap.

---

## Issue 4: AI-Powered Results Recap

**Problem:** Results page only shows a radar chart, leak cards, and recommended videos. No personalized written analysis.

**Solution:**

### New Edge Function: `audit-recap`
- Receives the full `AuditResults` object (scores, leaks, tier, all input data including new lifestyle questions)
- Sends it to the Lovable AI gateway (same pattern as `weekly-review`) using `google/gemini-3-flash-preview`
- System prompt instructs the AI to write a personalized 3-section recap:
  1. **Overall Assessment** -- Plain-language summary of where the user stands
  2. **Key Findings** -- Interpretation of each leak, why it matters, and what it means for their training
  3. **Action Plan** -- 3-5 prioritized, specific recommendations based on their data
- Returns markdown text

### Results Page Changes
- Add an "AI Analysis" card between the radar chart and the leaks section
- On page load, automatically call the `audit-recap` edge function with the results data
- Show a loading skeleton with "Generating your personalized analysis..." while processing
- Render the returned markdown in a styled card
- Add a "Regenerate Analysis" button

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/stores/authStore.ts` | Pass `full_name` metadata in signUp |
| `src/stores/auditStore.ts` | Make lift/engine fields optional, add new lifestyle fields, update leak detection and scoring for partial data |
| `src/components/audit/AuditForm.tsx` | Add skip/estimate/substitute UI for lifts, add alternative cardio tests, add new lifestyle questions, update validation |
| `src/components/audit/ResultsPage.tsx` | Add AI recap card with loading state, call new edge function |

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/audit-recap/index.ts` | Edge function that sends audit results to AI for personalized analysis |

### Database Migration

- Backfill existing "Anonymous" user profiles with email-derived names
- No new tables needed

### Updated AuditData Interface

```typescript
export interface AuditData {
  // Biometrics (required)
  weight: number;
  age: number;
  height: number;
  
  // Big 4 Ratios (all optional)
  backSquat?: number;
  frontSquat?: number;
  strictPress?: number;
  deadlift?: number;
  
  // Estimation tracking
  estimatedLifts?: Record<string, boolean>;
  substitutions?: Record<string, string>;
  
  // Engine Check (optional)
  mileRunTime?: number;
  cardioTest?: 'mile' | '2k-row' | '500m-row' | '2k-bike' | 'none';
  cardioTime?: number;
  
  // Lifestyle (required)
  sleep: '<6' | '6-7' | '7-8' | '8+';
  protein: 'yes' | 'no' | 'unsure';
  stress: number;
  experience: '<1' | '1-3' | '3-5' | '5+';
  
  // New lifestyle questions
  trainingFrequency?: '1-2' | '3-4' | '5-6' | '7';
  primaryGoal?: 'strength' | 'conditioning' | 'body-comp' | 'sport' | 'health';
  injuryHistory?: 'none' | 'upper' | 'lower' | 'back' | 'multiple';
  waterIntake?: '<1L' | '1-2L' | '2-3L' | '3L+';
  alcohol?: 'never' | '1-2x' | '3-4x' | 'daily';
}
```

### Estimation Formula (Epley)

```text
Estimated 1RM = weight x (1 + reps / 30)
```

Used when a user enters "I did 225 lbs for 5 reps" instead of a true 1RM.
