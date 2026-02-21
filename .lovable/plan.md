

# Enhance AI Weekly Review with Expert-Backed Recommendations

## What Changes

The system prompt in `supabase/functions/weekly-review/index.ts` will be expanded to include a knowledge base of principles from five trusted authorities. The AI will draw on these frameworks when making lifestyle, nutrition, and recovery recommendations -- grounding its advice in established methodologies rather than generic suggestions.

## Knowledge Sources

| Authority | Domain | Key Frameworks the AI Will Reference |
|-----------|--------|--------------------------------------|
| **Andrew Huberman** | Neuroscience / Sleep / Light | Morning sunlight exposure for circadian rhythm, cold exposure protocols, dopamine management, non-sleep deep rest (NSDR), caffeine timing (90 min post-wake) |
| **Matthew Walker** | Sleep Science | Sleep consistency over duration, 7-9 hour target, cool sleep environment (65-68F), no alcohol before bed, sleep debt is cumulative and not fully recoverable |
| **OPEX Fitness** | Program Design / Assessment | Individual design methodology, energy system development hierarchy, assessment-driven programming, fitness-fatigue model, life stress as training variable |
| **Precision Nutrition** | Nutrition Coaching | Hand-portion method, habit-based coaching, 80% consistency > 100% perfection, anchor habits, outcome vs behavior goals, calorie awareness without obsessive tracking |
| **Nutrition Coaching Institute** | Behavior Change / Nutrition | Client-centered coaching, motivational interviewing, sustainable nutrition habits, periodized nutrition aligned with training phases, stress-eating pattern recognition |

## How It Works

The system prompt gains a new section called "EXPERT KNOWLEDGE BASE" that instructs the AI to weave in specific, actionable recommendations attributed to these sources when the data warrants it. For example:

- Low readiness + check-in notes mentioning poor sleep --> Reference Matthew Walker's sleep consistency principle and Huberman's morning light protocol
- High training load + no conditioning --> Reference OPEX's energy system hierarchy
- Bodyweight fluctuating + stress notes --> Reference Precision Nutrition's 80% consistency framework and NCI's stress-eating pattern recognition
- Low readiness across the week --> Reference Huberman's NSDR protocol and Walker's sleep debt concept

The AI will naturally select which experts to cite based on the data patterns it sees -- it won't force all five into every review.

## Technical Details

### File: `supabase/functions/weekly-review/index.ts`

**System prompt (line 65)**: Append the expert knowledge base section after the existing autoregulation logic. The prompt will instruct the AI to:

1. When making sleep recommendations, draw from Walker (sleep consistency, 7-9 hours, cool environment) and Huberman (morning sunlight, caffeine delay, NSDR)
2. When making training recommendations, draw from OPEX (individual design, fitness-fatigue model, energy system hierarchy)
3. When making nutrition recommendations, draw from Precision Nutrition (hand portions, anchor habits, 80% rule) and NCI (periodized nutrition, behavior-first coaching)
4. Cite the source naturally (e.g., "As Huberman recommends..." or "Following Precision Nutrition's framework...")
5. Limit to 1-2 expert references per review to keep it concise -- pick the most relevant ones based on the data

**User prompt (line 52)**: Add a line: "Where appropriate, ground your recommendations in established coaching frameworks from Huberman, Walker, OPEX, Precision Nutrition, or NCI."

No other files change. No database changes. Just the edge function prompt update and redeployment.

