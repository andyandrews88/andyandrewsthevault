

# Three Enhancements: Interactive Onboarding, Structured Weekly Review, and Audit Nutrition Habits

## 1. Interactive Onboarding Tutorial (Navigate Between Tabs)

### Current State
The onboarding is a static dialog modal with 8 steps of text. It never leaves the dialog or shows users the actual UI. Users read descriptions but never interact with the real features.

### New Approach
Replace the dialog-only walkthrough with a **guided tour** that navigates users through the actual Vault tabs. Each step highlights the real UI on the real page, with a floating tooltip/card overlay explaining what they're looking at.

### How It Works

1. **Step 1 (Welcome)** -- Still a centered dialog. Explains the system and the loop.
2. **Step 2 (Dashboard)** -- Closes dialog, sets `activeTab` to `"dashboard"`, renders a floating tooltip card pointing at the Weekly Review section: "This is where your AI coaching review appears each week."
3. **Step 3 (Lifestyle)** -- Switches to `"lifestyle"` tab, tooltip highlights the Daily Check-In card: "Start each day here. Rate your sleep, stress, energy -- and write notes."
4. **Step 4 (Training)** -- Switches to `"workouts"` tab, tooltip highlights the workout logger: "Log your strength and conditioning work here. Add RIR to help the AI assess intensity."
5. **Step 5 (Nutrition)** -- Switches to the Nutrition page link or stays on Vault. Tooltip explains Simple vs Detailed tracking modes.
6. **Step 6 (Progress)** -- Switches to `"progress"` tab. "Track bodyweight and body measurements here."
7. **Step 7 (Get Started)** -- Switches back to `"lifestyle"` tab with a final CTA: "Do Your First Check-In."

### Technical Details

**File: `src/components/vault/OnboardingWalkthrough.tsx`** -- Full rewrite.
- Instead of a `Dialog`, the component renders a **floating card** (`position: fixed`, bottom-center or top-center) that persists across tab changes.
- Each step definition includes a `tab` property (e.g., `tab: 'lifestyle'`) and an optional `highlightSelector` for future spotlight support.
- On each step transition, the component calls the parent's `onTabChange` callback to programmatically switch the active tab.
- Step 1 remains a full centered dialog (the welcome/intro). Steps 2-7 use the floating tooltip card.
- Navigation: Back, Next, Skip buttons on the floating card. Progress dots.
- The floating card has a semi-transparent backdrop pulse or subtle border glow to draw attention.

**File: `src/pages/Vault.tsx`** -- Modify.
- Pass `activeTab` and `setActiveTab` (via `handleTabChange`) to `OnboardingWalkthrough` as props: `onTabChange={(tab) => handleTabChange(tab)}` and `currentTab={activeTab}`.
- The onboarding component calls `onTabChange('lifestyle')` etc. to drive navigation.

**Props change for OnboardingWalkthrough:**
```
interface OnboardingWalkthroughProps {
  onComplete?: (tab?: string) => void;
  onTabChange?: (tab: string) => void;
  currentTab?: string;
}
```

---

## 2. Structured Weekly Review (Training / Nutrition / Lifestyle / Overall)

### Current State
The AI returns a single 4-6 sentence paragraph. No structure, no categories. Hard to scan.

### New Approach
Instruct the AI to return its review in **4 labeled sections** using a simple delimiter format. The frontend parses the response and renders each section in its own card/accordion.

### Sections
1. **Training** -- Volume, PRs, RIR analysis, conditioning load, autoregulation assessment
2. **Nutrition** -- Weight trends, hand-portion adherence, calorie patterns, PN habit data
3. **Lifestyle** -- Readiness scores, sleep patterns, stress, check-in note analysis, recovery
4. **Overall Summary** -- 2-3 sentence synthesis with the top 1-2 action items for next week

### Technical Details

**File: `supabase/functions/weekly-review/index.ts`**
- Update the system prompt to instruct the AI to return its review in exactly 4 sections with headers: `## Training`, `## Nutrition`, `## Lifestyle`, `## Overall Summary`.
- Update the user prompt to say: "Structure your review into exactly four sections: Training, Nutrition, Lifestyle, and Overall Summary. Use ## headers for each."
- Change output length from "4-6 sentences" to "3-4 sentences per section" (roughly the same total length but organized).

**File: `src/components/dashboard/WeeklyReview.tsx`**
- After receiving `aiReview`, parse it by splitting on `## ` headers into sections.
- Render each section in a collapsible card or accordion with icons:
  - Training (Dumbbell icon)
  - Nutrition (Apple icon)
  - Lifestyle (Heart icon)
  - Overall Summary (Sparkles icon)
- Fallback: if the AI doesn't return headers (e.g., old cached response), display the full text as-is in the current single block.
- Add a simple parser:
  ```
  function parseSections(text: string): { title: string; content: string }[] {
    const parts = text.split(/^## /m).filter(Boolean);
    return parts.map(p => {
      const [title, ...rest] = p.split('\n');
      return { title: title.trim(), content: rest.join('\n').trim() };
    });
  }
  ```

---

## 3. Precision Nutrition Habit Questions in the Audit

### Current State
The Lifestyle step (step 3) asks about sleep, protein intake, stress, experience, training frequency, primary goal, injury history, water, and alcohol. No questions about eating behaviors or PN-specific habits.

### New Questions (Added to Step 3: Lifestyle)
These gather behavioral nutrition data that the audit-recap AI can use:

| Question | Options | Data Key |
|----------|---------|----------|
| Do you eat slowly and without distractions? | Always / Sometimes / Rarely | `eatsSlowly` |
| Do you stop eating at 80% full? | Always / Sometimes / Rarely | `stopsAt80` |
| Do you include protein at every meal? | Always / Sometimes / Rarely | `proteinEveryMeal` |
| Do you eat vegetables or fruit at every meal? | Always / Sometimes / Rarely | `veggiesEveryMeal` |
| Do you plan or prep meals in advance? | Always / Sometimes / Rarely | `mealPrep` |
| How consistent is your eating schedule? | Very / Somewhat / Inconsistent | `eatingConsistency` |

### Technical Details

**File: `src/stores/auditStore.ts`**
- Add 6 new optional fields to `AuditData`:
  ```
  eatsSlowly?: 'always' | 'sometimes' | 'rarely';
  stopsAt80?: 'always' | 'sometimes' | 'rarely';
  proteinEveryMeal?: 'always' | 'sometimes' | 'rarely';
  veggiesEveryMeal?: 'always' | 'sometimes' | 'rarely';
  mealPrep?: 'always' | 'sometimes' | 'rarely';
  eatingConsistency?: 'very' | 'somewhat' | 'inconsistent';
  ```
- Update `detectLeaks()` to add a new "Nutrition Habits Leak" if 3+ of these are "rarely":
  - Title: "Nutrition Behavior Leak"
  - Description: "Multiple foundational eating habits are inconsistent, undermining nutrition quality regardless of what you eat."
  - Recommendation: Reference Precision Nutrition's anchor habits framework.

**File: `src/components/audit/AuditForm.tsx`**
- Add a new section within Step 3 (Lifestyle) titled "Nutrition Habits" with a subtle divider.
- Render 6 ToggleGroup rows (Always / Sometimes / Rarely) for each habit question.
- All are optional -- they don't block progression.

**File: `supabase/functions/audit-recap/index.ts`**
- Add a new `## Nutrition Habits` section to the data summary sent to the AI:
  ```
  lines.push(`\n## Nutrition Habits`);
  if (d.eatsSlowly) lines.push(`- Eats slowly: ${d.eatsSlowly}`);
  // ... etc for each habit
  ```
- Update the user prompt to instruct the AI to reference PN habits in its analysis when the data is present.

### Review Step Update
**File: `src/components/audit/AuditForm.tsx`** (Step 4: Review)
- Add a row showing the count of "strong" habits (those marked "always") out of 6, e.g., "Nutrition Habits: 4/6 strong".

---

## Files Summary

| File | Action | Change |
|------|--------|--------|
| `src/components/vault/OnboardingWalkthrough.tsx` | Rewrite | Dialog-first welcome, then floating tooltip that drives tab navigation |
| `src/pages/Vault.tsx` | Modify | Pass `onTabChange` and `currentTab` to onboarding component |
| `supabase/functions/weekly-review/index.ts` | Modify | Restructure prompt for 4 sections (Training/Nutrition/Lifestyle/Overall) |
| `src/components/dashboard/WeeklyReview.tsx` | Modify | Parse AI response into sections, render in accordion/cards |
| `src/stores/auditStore.ts` | Modify | Add 6 PN habit fields to AuditData, add nutrition behavior leak detection |
| `src/components/audit/AuditForm.tsx` | Modify | Add "Nutrition Habits" section with 6 toggle questions in Step 3, update Review step |
| `supabase/functions/audit-recap/index.ts` | Modify | Include PN habit data in AI summary prompt |

No database changes required. Two edge functions redeployed.

