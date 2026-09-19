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

## Phase 4 — Coach side (complete, verified in-app)
- [x] `/coach` roster: active / archived / invites, search, per-client real activity only
- [x] Add Client → name + email + tier → `coach-invite` edge function (create/resend/revoke/sync)
- [x] Archive / restore via relationship status only — no deletes, all history kept
- [x] `/coach/client/:id` workspace: Overview | Training | Nutrition | Progress | Messages
- [x] Tier 1 vs Tier 2 entitlements centralised in `src/lib/entitlements.ts` + `useEntitlement`
- [x] `/coach/programs`: Tier 2 curated availability manager + existing program builder
- [x] `/coach/movements`: coach-only movement library (athlete submit policy removed)
- [x] Athlete program browsing now driven by curated availability (`CuratedPrograms`)
- [x] RLS: relationship+tier gated DMs (`can_direct_message`), coach-only movement writes,
      unique relationship pair, unique pending invite, unique availability scope
- [x] Fixed: availability upsert conflict target now matches the 4-column unique scope
      (`coach_id,program_id,service_tier,client_id`); badge markup nesting corrected
- [x] End-to-end signed-in run: roster tabs, invite create (new + existing account link),
      resend, revoke, archive, restore, Tier 1/Tier 2 workspace behaviour, availability toggle
      persistence, coach-only movement writes, DM entitlement, athlete route guard
- [x] Multi-coach readiness: templates now have coach-owned RLS policies (admin access kept),
      `admin-workout-builder` accepts any coach but scopes them to their own clients and templates,
      session builder page guarded by coach entitlement instead of admin role
- [x] Program assignment verified end-to-end as a non-admin coach (template → schedule → sessions)
- [x] All temporary test data removed; integrity counts identical to Phase 4 baseline
- Known: Supabase linter reports 7 "signed-in users can execute SECURITY DEFINER function"
  warnings — these are the RLS helper functions and are required by the policies.


## Phase 5 — Messaging + push (complete)
- [x] Shared `Conversation` used by athlete Coach tab and coach Client Messages (one thread)
- [x] Text + voice notes: real MIME/extension handling (m4a/webm/ogg/mp3/wav), private upload,
      signed playback, optimistic send with retry/discard, read receipts
- [x] Tier 2 = paid-call CTA only; archived relationship keeps history, disables sending
- [x] Contextual comments: "ask your coach" from a session and from a logged meal →
      context chip on the composed message
- [x] `notify-user` edge function: per-recipient Web Push, relationship/coach authorisation,
      recipient preferences respected, expired subscriptions cleaned
- [x] Programming push on template assignment; message push on send (best-effort)
- [x] Notification preferences: mute all, messages, programming, reminders (+ legacy toggles)
- [x] Unread badges from real direct-message unread counts (nav + coach Messages tab)
- [x] Verified signed-in on mobile viewport: send/persist/reload, deep links, Train renders
      the in-progress session (no spinner); test messages removed, 6 historical DMs intact
- [x] Security scan: no critical findings; avatar upload ownership policy tightened

## Later phases (not started)
- P6 Analytics, P7 Payments/booking, P8 Retirement of deprecated areas.

## Deferred
- Andy's Assault Bike conditioning entry — log after foundation is complete.
- Paid coaching-call booking for Tier 2 (CTA placeholder only) — P7.
