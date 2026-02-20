

# Fix RIR Logic in AI Weekly Review

## The Problem

The system prompt in the `weekly-review` edge function has inverted RIR coaching advice:

**Current (wrong):**
- RIR 0-1 -> "suggest deload or backing off accessories"
- RIR 3+ -> "suggest pushing harder on compounds"

**Correct interpretation:**
- RIR 0 = maximum effort, no reps left
- RIR 1 = one rep left, very hard
- RIR 2 = two reps left, productive sweet spot
- RIR 3+ = moderate/low intensity, warm-up territory

The fix also needs to account for the **readiness-RIR relationship**: low RIR is only a concern when readiness is also low (risk of injury/overtraining), and high RIR is only a concern when readiness is high (sandbagging).

## What Changes

### File: `supabase/functions/weekly-review/index.ts`

Replace the RIR section of the system prompt (line 65) with corrected coaching logic that:

- Defines the RIR scale correctly (lower = harder)
- Cross-references RIR with readiness data
- High readiness + high RIR = athlete may be sandbagging, suggest pushing intensity
- Low readiness + low RIR = athlete is overreaching, suggest backing off
- High readiness + low RIR = ideal, performing well when body is ready
- Low readiness + high RIR = smart autoregulation, acknowledge the adjustment

Also update the user prompt hint (line 52) to reinforce the correct interpretation.

## Technical Details

Only one file changes: the edge function prompt text. No database, UI, or store changes needed. The data collection (avg RIR, hard sets %, readiness scores) is already correct -- only the AI's interpretation instructions are wrong.

| File | Change |
|------|--------|
| `supabase/functions/weekly-review/index.ts` | Rewrite RIR coaching instructions in both system and user prompts to use correct scale and cross-reference with readiness |

