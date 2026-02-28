

# UI Refinement & Audit Fix Schedule

All work organized into 5 sequential phases. Each phase is independent and testable.

---

## Phase 1: Mobile UX Polish (AuditForm + ResultsPage)

### 1A. Add `inputMode="decimal"` to all numeric movement inputs
**File:** `src/components/audit/AuditForm.tsx`
- Broad Jump input (~line 477): add `inputMode="decimal"`
- Dead Hang seconds input (~line 500): add `inputMode="decimal"`
- Pull-ups input (~line 570): add `inputMode="numeric"`
- Push-ups input (~line 582): add `inputMode="numeric"`
- L-Sit seconds input (~line 594): add `inputMode="decimal"`
- Biometrics inputs (weight, age, height): verify they have proper inputMode

### 1B. Radar chart mobile fix
**File:** `src/components/audit/ResultsPage.tsx`
- Reduce `PolarAngleAxis` font size on mobile (use `useIsMobile()` hook)
- Shrink chart height from 400px to 300px on mobile
- Reduce `PolarRadiusAxis` tick count on mobile

### 1C. AI recap overflow fix
**File:** `src/components/audit/ResultsPage.tsx`
- Add `overflow-x-auto` to the prose container wrapping `renderMarkdown`
- Add `break-words` to prevent long text overflow

### 1D. Movement screen layout on 375px
**File:** `src/components/audit/AuditForm.tsx`
- Ensure broad jump toggle group wraps properly on small screens (add `flex-wrap`)
- Pistol squat grid: change to `grid-cols-1` on mobile via responsive class

---

## Phase 2: Edge Cases — Audit Logic

### 2A. Cardio "none" + time guard
**File:** `src/components/audit/AuditForm.tsx`
- When `cardioTest` is set to `'none'`, clear `cardioTime` and `mileRunTime` in the `onValueChange` handler (already partially done at line 422, verify it works)

### 2B. Stress slider explicit interaction
**File:** `src/components/audit/AuditForm.tsx`
- Track whether stress slider has been touched via a local state `stressTouched`
- On validation, if `!stressTouched` and stress is still default 5, show a soft prompt: "Please confirm your life stress level"
- Not a hard block — just a nudge

### 2C. Partial movement screen scoring fairness
**File:** `src/stores/auditStore.ts`
- Currently, skipped movement tests default to neutral (score 50) which is fair
- Add logic: if fewer than 3 movement tests are completed, add a note to `skippedAreas` saying "Limited movement data — scores reflect partial assessment"
- No score penalty change needed — the additive bonus system already handles this correctly

### 2D. Audit re-take data cleanup
**File:** `src/stores/auditStore.ts`
- The `reset()` function already clears `data`, `results`, and `currentStep`
- Verify the database sync (in `useUserDataSync`) overwrites the existing row on re-submission rather than inserting duplicates
**File:** `src/hooks/useUserDataSync.ts` — check upsert logic

---

## Phase 3: Audit-to-Results Flow

### 3A. AI recap error resilience
**File:** `src/components/audit/ResultsPage.tsx`
- Already has: skeleton loading, error state with retry button, and non-AI content renders independently
- Add a timeout: if recap takes >30s, show a "Taking longer than expected..." message with option to retry
- Add specific handling for 429/402 errors with user-friendly messages

### 3B. Results persistence
- Already handled by Zustand `persist` middleware (localStorage)
- Verify: navigate away and back — results should still be there
- This is a test-only item, no code change expected

---

## Phase 4: Verify & Test

- Test audit form on 375px mobile viewport end-to-end
- Test with only biometrics + lifestyle filled (skip strength, engine, movement)
- Test retake flow: complete audit, view results, retake, verify clean state
- Test AI recap failure: verify scores/leaks/radar still render without AI

---

## Technical Details

### Files Modified
| File | Changes |
|------|---------|
| `src/components/audit/AuditForm.tsx` | inputMode attrs, flex-wrap fixes, stress nudge, responsive pistol grid |
| `src/components/audit/ResultsPage.tsx` | Radar chart mobile sizing, prose overflow, recap timeout |
| `src/stores/auditStore.ts` | Partial movement note in skippedAreas |
| `src/hooks/useUserDataSync.ts` | Verify upsert (read-only check, may not need changes) |

### No new dependencies needed

