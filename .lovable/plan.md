

# Updated Movement Screen Plan — Complete with AI Screening

The previously approved plan adds 10 movement screen tests. This update ensures the AI recap edge function is also updated to include all movement data in its analysis.

## Files to Modify

| File | Changes |
|------|---------|
| `src/stores/auditStore.ts` | Add 10 movement fields to `AuditData`, update `calculateScores`, `detectLeaks` |
| `src/components/audit/AuditForm.tsx` | Add Movement Screen step (index 3) with all 10 tests, skip toggles, info tooltips |
| `src/components/audit/ResultsPage.tsx` | Display movement screen data in results |
| `supabase/functions/audit-recap/index.ts` | Add movement screen section to AI prompt + update system prompt and user prompt |

## Movement Screen Fields (all optional, all skippable)

1. Broad Jump — toggle heel-to-toe (×2.5) vs feet, numeric input
2. Dead Hang — seconds
3. Toe Touch — 0=None, 1=Toes, 2=Palms
4. Heel Sit — pass/fail
5. Deep Squat — pass/fail
6. Overhead Reach — pass/fail
7. Max Pull-ups — numeric
8. Max Push-ups — numeric
9. Parallette L-Sit — seconds
10. Pistol Squat Barefoot — yes/no per leg (left + right)

## AI Recap Changes (`audit-recap/index.ts`)

### New data section added to prompt (after Cardio, before Scores)

```text
## Movement Screen
- Broad Jump: X feet
- Dead Hang: X seconds
- Toe Touch: None/Toes/Palms
- Heel Sit: Pass/Fail
- Deep Squat: Pass/Fail
- Overhead Reach: Pass/Fail
- Max Pull-ups: X reps
- Max Push-ups: X reps
- Parallette L-Sit: X seconds
- Pistol Squat (Left): Yes/No, (Right): Yes/No
```

Only include fields that were completed (not skipped).

### Updated system prompt

Add movement quality expertise:

> "You are a performance coach and movement specialist writing a personalized audit recap. You understand FMS (Functional Movement Screen) principles, Gray Cook's movement hierarchy, and strength-to-bodyweight ratios. Be direct, knowledgeable, and actionable."

### Updated user prompt — 4 sections instead of 3

```
1. **Overall Assessment** — 2-3 sentences
2. **Key Findings** — Interpret each leak. If movement screen data is provided, analyze mobility patterns (toe touch + heel sit + deep squat + overhead reach), power output (broad jump), grip/core stability (dead hang + L-sit), muscular endurance (pull-ups + push-ups), and single-leg symmetry (pistol squats). Flag asymmetries.
3. **Movement Quality Assessment** — Analyze movement screen results using FMS principles. Identify mobility restrictions vs stability deficits. Note if the athlete has strength but lacks movement quality (or vice versa). Reference specific test results.
4. **Action Plan** — 3-5 prioritized recommendations incorporating movement corrections alongside strength/conditioning work.
```

### Increase word limit from 500 to 700

The extra section needs space. Update system prompt: "Keep it under 700 words total."

## Scoring & Leak Detection Updates (`auditStore.ts`)

- Mobility: toeTouch (2=+20, 1=+10), heelSit pass=+10, deepSquat pass=+10, overheadReach pass=+10
- Power: broadJumpFeet >8ft=+15, >6ft=+10
- Stability: deadHangSeconds >60s=+15, >30s=+10; lSitSeconds >30s=+15, >15s=+10
- Endurance: pullups >15=+15, >8=+10; pushups >30=+15, >15=+10
- Pistol squats: both pass=+15, one only=+5 + asymmetry leak
- New leaks: Mobility Deficit, Grip/Stability, Upper Body Endurance, Single-Leg Asymmetry

