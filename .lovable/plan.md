# The Vault — Final Build Plan (coaching platform)

Locked decisions from Andy are treated as settled. No code or data changes in this turn.

## 1. Final navigation

Athlete (bottom bar, four items):
```text
TODAY   |   TRAIN   |   NUTRITION   |   COACH
```
- **Today** — assigned session, nutrition target vs logged, any item that needs action (unread coach message, missing weigh-in), nothing else.
- **Train** — today's session, this week, history, movement history, strength and conditioning analytics.
- **Nutrition** — today's log (photo / voice / manual), targets, history.
- **Progress** lives inside Train/Today as a single "Progress" screen reachable from Today (bodyweight, measurements, InBody, photos) — not a fifth tab.
- **Coach** — the private conversation with Andy, text and voice.
- **Resources** — reached from the profile/menu, not the bottom bar.

Coach (Andy only; he switches between his coach view and his own athlete view):
```text
ROSTER → CLIENT → [ Overview | Training | Nutrition | Progress | Messages ]
```
Roster = active Tier 1/Tier 2 clients with compliance at a glance (trained today/this week, nutrition logged, unread message, last activity). Plus a Programs/Templates builder and a Movement Library, both coach-only.

## 2. Core workflows

**Assign training.** Andy builds a block → weeks → days → sessions → movements with instructions. Per movement he either prescribes exact sets/reps/load/RPE, or prescribes work only and the athlete fills in their own numbers. Both are first-class. He sets how far ahead the athlete can see (today only / this week / whole block) per client.

**Log strength.** Open today's session → movement → set rows: reps, weight, unit, RPE, notes, done. Last comparable performance shows inline on every set row. Supersets, circuits, intervals, AMRAP, EMOM and for-time are grouped formats over the same set rows.

**Log conditioning.** Modality, duration, calories, distance, avg watts, avg speed, RPM/cadence, avg/max HR, HR zone, RPE, notes — with coach-prescribed targets shown alongside.

**Log nutrition.** Photo, voice or manual → AI estimate shown clearly as an estimate → athlete confirms or edits → saved. Andy can review and comment.

**Communicate.** One continuous coach-client thread, text and voice messages, plus comments attached to a specific session or food entry.

## 3. Schema and migration (additive first)

Preserved and built on: `workouts`, `workout_exercises`, `exercise_sets`, `conditioning_sets`, `exercise_library`, `programs`, `program_workouts`, `user_program_enrollments`, `user_calendar_workouts`, `user_food_diary`, `user_nutrition_data`, `user_body_entries`, `user_profiles`, `direct_messages`, `user_roles`, `coach_program_templates`/`coach_template_workouts`. Existing volume stays intact: 81 workouts, 237 exercises, 668 sets, 270 scheduled days, 44 food entries, 10 body entries, 82 movements.

Additions:
- `coach_client_relationships` — coach, client, tier (1/2), status, start/end. Backfill Andy ↔ every existing athlete, including Andy ↔ Andy so his own logging runs through the identical athlete path.
- `exercise_sets` — add `unit` (kg/lb, backfilled from each athlete's current preference and then immutable per row), `tempo`, `notes`, `is_prescribed`, prescribed reps/load/RPE.
- `workout_exercises` — add `format` (straight/superset/circuit/interval/amrap/emom/for_time), group id, round/interval config, coach instructions.
- `conditioning_sets` — add modality, avg watts, avg speed, cadence/RPM, max HR, HR zone, RPE, notes, plus prescribed target fields.
- `personal_records` — populated automatically by trigger (heaviest set, best estimated 1RM, rep PRs) and backfilled from the 668 existing sets; currently empty, which is why every PR surface is blank today.
- Programming: `program_blocks` over the existing program/week/day rows, plus a per-enrolment `visible_through` control.
- Nutrition: `nutrition_targets` per athlete with effective dates; `user_food_diary` gains source (photo/voice/manual), photo path, transcript, AI estimate, confirmed flag, coach comment.
- Progress: `user_body_entries` gains progress photo support (private bucket) and keeps InBody fields already present.
- Messaging: conversation id, message kind (text/voice), audio path, read state, optional link to a workout or food entry.
- Storage buckets (private): meal photos, progress photos, voice notes.

Nothing is dropped in the build phases; deprecated tables are hidden from the app and deleted only later on Andy's word.

## 4. Voice and AI architecture

All AI runs server-side through Lovable AI; no keys in the app.
- **Training voice** — record → transcribe → parse into movement/set/reps/load/unit/RPE → show a filled confirmation card → saves only when the athlete confirms. Anything unparsed is left blank and flagged, never guessed into the log.
- **Nutrition voice/photo** — transcribe or read the photo → estimate calories/macros → display as "Estimate — check before saving" → athlete confirms or edits → saved with source and original transcript/photo kept for Andy.
- **Coach voice messages** — stored and played as audio, never parsed into data.
- **Guardrails** — AI can structure input, estimate nutrition, and summarise patterns for Andy. It cannot alter programming, prescribe, or message a client on Andy's behalf. Every AI value is marked as an estimate until confirmed.

## 5. Access and security
- Closed platform: no public sign-up. Andy provisions accounts/invites; a client with no active relationship sees a "contact your coach" screen, not the app.
- All access rules key off `coach_client_relationships` rather than "is admin", so adding a second coach later needs no rewrite and no UI now.
- Andy's dual role works because he is both coach and his own client row; his athlete screens use the ordinary athlete rules.
- Coach can read and write assigned training, and read nutrition, progress, body entries and messages for his own clients only — coach access to nutrition and check-ins is missing today and gets added.
- Profile visibility narrows from "any signed-in user" to self + own coach.
- Private buckets for photos and voice notes, with signed access limited to owner and coach.
- Security scan run at the end of each phase.

## 6. Loading, saving, performance
- One query per screen; Today loads session + targets + unread in a single round trip.
- Optimistic set logging with a visible saved/retry state — no silent failures.
- Kill the repeat fetching on every tab switch and the metadata refetch loop in the logger; cache per day.
- Collapse the overlapping stores (workout/program/dashboard/progress) into per-feature data fetching with caching.
- Lazy-load history and charts; consistent visible error handling.

## 7. Phases and acceptance criteria

**P1 — Foundation (invisible to users).** Relationships + backfill, new columns, PR trigger + backfill, permission rewrite, buckets.
*Accept:* all existing data readable exactly as before; Andy appears as coach and athlete; PR board shows real records from historic sets; security scan clean.

**P2 — Train.** New session logging: prescribed vs athlete-entered, inline previous performance, per-set unit, RPE, notes, all workout formats, full conditioning metrics.
*Accept:* a full strength session and the Assault Bike session (45:26, 290.5 cal, 13.4 mi, 150 W, 17.9 mph, 46 RPM — no invented HR/RPE) log and reload correctly on mobile.

**P3 — Today + Nutrition + Progress.** Four-tab shell, targets, photo/voice/manual food logging with confirm step, bodyweight/measurements/InBody/photos.
*Accept:* an athlete completes a full day (session + meals + weight) without leaving the four tabs; every AI value passes through confirmation.

**P4 — Coach side.** Roster, client workspace, block/week/day programming, visibility control, movement library, compliance.
*Accept:* Andy programmes a block for a real client, sets visibility, and reviews their week without touching the old admin pages.

**P5 — Messaging + push.** Conversation, voice messages, contextual comments, notifications for messages and new programming, with per-type controls.
*Accept:* message and new-session notifications arrive on iOS/Android home-screen installs; muting works.

**P6 — Analytics.** Estimated 1RM, rep PRs, volume/load/RPE trends, coach-side deeper views.

**P7 — Payments/access.** Packages, purchase, access state, Andy notified, access provisioned. Deliberately last, after the data model is stable — it changes who can enter the app, so it ships on top of a proven access layer, never inside a migration.

**P8 — Retirement.** Export archives, then delete deprecated tables on Andy's explicit approval.

## 8. Deprecate / archive (hidden, not deleted)
Community (channels, posts, likes, threads, announcements — 8 posts exported), Fitness Audit + results (7 records, provision retained), standalone Podcast area (content moves into Resources or links out), Lifestyle/breathwork and the daily readiness check-in (architecture retained for later), Goals panel, wearables, subscriptions/trial logic, onboarding walkthrough, dashboard customise mode, marketing/landing sections inside the app. PT packages/invoices data is kept and folded into P7 rather than archived.

## 9. Remaining blockers
1. **Tier 1 vs Tier 2** — what differs functionally between the tiers (nutrition targets, messaging frequency, programming depth)? Needed before the roster and access rules are finalised.
2. **Client accounts** — should Andy invite by email from the roster, or keep creating accounts manually?
3. **Assault Bike session** — confirm it logs to Andy's own athlete account and the date to use.
4. **Existing 15 accounts** — which are genuine paying clients, which should be archived/deactivated at P1?
