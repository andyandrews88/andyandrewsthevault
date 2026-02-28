

# Remove Expert Name-Drops & Embed Deep Knowledge Into AI Prompts

## Problem
All AI-generated reviews currently name-drop experts ("per Matthew Walker," "according to Precision Nutrition," etc.). Users should receive the recommendations directly as coaching wisdom without attribution. Additionally, the knowledge base in the prompts is shallow — just bullet points of expert names.

## Files to Modify (4 edge functions)

### 1. `supabase/functions/weekly-review/index.ts`

**System prompt changes:**
- Remove the entire `EXPERT KNOWLEDGE BASE` section that lists Huberman, Walker, OPEX, PN, NCI by name
- Replace with embedded actionable knowledge (no attributions):

```
SLEEP & RECOVERY KNOWLEDGE:
- 7-9 hours is non-negotiable for recovery. Consistency of sleep/wake times (±1 hour, 7 days/week) matters more than total hours.
- Morning sunlight exposure within 30-60 min of waking sets circadian rhythm and improves sleep quality that night.
- Delay caffeine 90-120 min after waking to avoid afternoon crashes. No caffeine after 4pm.
- A 1-3 degree drop in body temperature is required to initiate sleep. Cool bedroom (65-68°F), warm shower before bed.
- Non-Sleep Deep Rest (NSDR) protocols (10-20 min yoga nidra or body scan) can partially restore missed sleep and reduce cortisol.
- Sleep debt is cumulative and cannot be "caught up" on weekends.

TRAINING & AUTOREGULATION:
- Life stress is a training variable. High life stress = reduce training volume/intensity, not increase it.
- The aerobic system is the foundation of all energy systems. Aerobic base work (nasal-breathing pace) should comprise 70-80% of conditioning volume.
- Fitness-fatigue model: performance = fitness minus fatigue. Deload when accumulated fatigue exceeds fitness gains.
- The body adapts to stress during recovery, not during the session itself.
- Gain (strength), Pain (glycolytic), Sustain (aerobic) — balanced development across all three energy systems.

NUTRITION & HABITS:
- One habit at a time. Research shows 80%+ adherence when focusing on a single behavior change; <5% success when attempting 3+ simultaneously.
- Hand-portion method: 1 palm protein, 1 fist vegetables, 1 cupped hand carbs, 1 thumb fats — per meal as baseline.
- 80% consistency beats 100% perfection. Missing 1-2 meals per week from plan is normal and sustainable.
- Caloric deficit is king for fat loss, but sustained deficits cause metabolic adaptation — periodic diet breaks or maintenance phases are essential.
- Protein intake 0.7-1.2g/lb bodyweight depending on activity type and goals.
- Stress-eating is a symptom, not the problem. Address sleep, stress management, and meal timing before restricting further.
- Periodize nutrition: fat loss phases, maintenance phases, and performance phases serve different goals and cannot be pursued simultaneously.
```

**User prompt changes:**
- Remove the line: "Where appropriate, ground your recommendations in established coaching frameworks from Huberman, Walker, OPEX, Precision Nutrition, or NCI."
- Replace with: "Give recommendations as direct coaching advice. Never cite or name-drop any experts, books, or certifications — just give the recommendation."

### 2. `supabase/functions/audit-recap/index.ts`

**System prompt changes:**
- Add the same nutrition/training/lifestyle knowledge block (adapted for audit context)
- Add explicit instruction: "Never mention expert names, certifications, or coaching organizations. Give advice directly as the coach."
- Keep FMS and movement analysis expertise but remove "Gray Cook" name reference

**User prompt changes:**
- Remove "Precision Nutrition anchor habit recommendation" phrasing
- Change to: "pick ONE simple nutrition habit to focus on for 2 weeks (e.g., protein at every meal, eating slowly, planning meals in advance)"
- Remove "Precision Nutrition habit data" label, change to "Nutrition habit data"

**Data section:**
- Change `## Nutrition Habits (Precision Nutrition)` to `## Nutrition Habits`

### 3. `supabase/functions/admin-client-report/index.ts`

**System prompt (line 131):**
- Remove "(per Matthew Walker: 7-9h optimal)" from section 3 description
- Change to: "Sleep hours analysis (7-9h optimal for recovery and hormonal regulation)"
- Add to end of system prompt: "Never reference specific experts, authors, or coaching organizations by name. Deliver all advice as direct coaching guidance."

### 4. `supabase/functions/admin-intelligence/index.ts`

- No expert references found, but add the same instruction to the system prompt: "Never reference specific experts, authors, or coaching organizations by name."

## Summary of Changes

| What | Before | After |
|------|--------|-------|
| Expert references | "per Matthew Walker," "Huberman recommends," "Precision Nutrition" | Direct coaching advice with no attribution |
| Knowledge depth | Shallow bullet points (names + 3 words) | Full actionable protocols with specific numbers, thresholds, and reasoning |
| Nutrition habits label | "Precision Nutrition" | "Nutrition Habits" |
| Movement analysis | "Gray Cook's movement hierarchy" | "movement hierarchy principles" (same knowledge, no name) |
| Prompt instruction | "ground in frameworks from Huberman, Walker..." | "Never cite experts. Give direct coaching advice." |

