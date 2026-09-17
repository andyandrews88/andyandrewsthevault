# The Vault rebuild roadmap

Source of truth: approved final plan (archived under `.lovable/plan/`).

## Phase 1 — Foundation (complete)
- [x] coach_client_relationships + service tier/status + backfill (incl. Andy dual role)
- [x] client_invites data model + lifecycle
- [x] Archive/restore semantics at data + access layer
- [x] Training schema additions (set unit/tempo/notes/prescription, exercise format/group, conditioning metrics + targets)
- [x] Program availability/entitlement foundation
- [x] Personal records trigger + conservative backfill (incl. estimated 1RM)
- [x] Nutrition targets + food entry source/photo/transcript/AI estimate/confirmation
- [x] Progress photo support + private buckets (meal photos, progress photos, voice notes)
- [x] Messaging kind/audio/read/context fields
- [x] RLS rewrite around relationships; narrow profile visibility
- [x] Verify counts vs baseline + security scan + app loads

## Phase 2 — Train (complete)
- [x] Unit-correct history: all legacy sets/PRs relabelled `lb` (values were always stored in lb)
- [x] `sessionStore` — single source for the open session, explicit save/error/retry state
- [x] Train landing: week strip, today's assigned/in-progress session, empty session, recent history
- [x] Session screen: sections, grouped formats (superset/circuit/interval/AMRAP/EMOM/for time), progress, finish/reopen
- [x] Strength rows: reps/load/per-row unit/RPE/tempo/notes/completion + prescribed vs actual + last performance inline
- [x] Conditioning logger: modality-contextual fields (time, cals, distance, watts, speed, cadence, HR, zone, RPE, notes) + coach targets
- [x] Movement history sheet with PR/e1RM context
- [x] Program sessions now write prescription fields + conditioning sets
- [x] Mobile verification, data-integrity counts unchanged

Deferred from P2: voice logging (P3/P5 per plan), full charts/trends (P6),
legacy `WorkoutTab` analytics components retained in repo but no longer routed.

## Phase 3 — Today / Nutrition / Progress (complete)
- [x] `nutritionLogStore` — day entries, effective-dated targets, private photo upload/signing, CRUD + save/error state
- [x] `nutrition-estimate` edge function (Lovable AI vision) — returns estimates only, never writes
- [x] Log Meal sheet: photo / voice / typed, AI estimate → athlete confirm & edit → save
- [x] Nutrition tab: day navigation, target vs actual macros, entries by meal slot, coach targets (admin)
- [x] Today command center: training, nutrition, weigh-in prompt when due, coach unread
- [x] Progress photos (private `progress-photos` bucket) added to Body
- [x] Athlete IA switched to Today | Train | Nutrition | Coach; Body/Resources under More
- [x] Community / Lifestyle / Podcast / Tracks / Audit removed from active nav — code and data retained
- [x] Onboarding tour rewritten for the new IA
- [x] Typecheck + lint clean; mobile verification of all four tabs signed in; no test data written

## Later phases (not started)
- P4 Coach side (roster, invites UI, archive UI), P5 Messaging + push,
  P6 Analytics, P7 Payments/booking, P8 Retirement of deprecated areas.

## Deferred
- Andy's Assault Bike conditioning entry — log after foundation is complete.
