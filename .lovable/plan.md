# The Vault → Coaching Platform: Audit & Rebuild Plan

No code or data has been changed. This is the audit and proposed sequence only.

## 1. Current-state audit

### What exists and is actually used (real data today)
- 15 people signed up, 15 profiles, 1 admin (Andy).
- Training: 81 workouts, 237 exercises, 668 sets, 9 conditioning entries, 82 movements in the exercise library.
- Programs: 6 programs, 252 program days, 14 enrolments, 270 scheduled calendar days.
- Nutrition: 44 food diary entries, 5 nutrition profiles, 0 saved meals, 0 custom foods.
- Body/lifestyle: 10 body entries, 28 daily check-ins, 3 goals.
- Messaging: 6 direct messages, 8 community posts.
- Barely/never used: personal records (0 rows — the PR board and PR badges have nothing behind them), podcasts (0), coach templates (1), coach-client assignments (0), custom foods (0), wearables (0), subscriptions (0).

### Information architecture
Everything lives inside one page with nine tabs (Home, Train, Library, Body, Lifestyle, Podcast, Community, My Coaching, Tracks, Admin) plus separate pages for Nutrition, Audit, Results, Profile, Program landing and five Admin pages. Train then has three sub-tabs, and Admin has its own nested tab set. That is three levels of tabs before an athlete reaches "log my set" — the single biggest usability problem.

### Structural problems found
- **No real coach-client relationship.** Everything is gated on "is admin". The `coach_client_assignments` table exists but is empty and unused, so the app only works for one coach and treats every athlete as "everyone else".
- **Coach cannot see nutrition.** Andy can read clients' workouts, sets and body entries, but there is no rule letting him read food logs, nutrition targets or daily check-ins. Coach nutrition feedback is impossible today.
- **Personal records are never written.** The PR board, PR badges and "estimated 1RM" surfaces read an empty table.
- **Conditioning is under-modelled.** Conditioning entries store only duration, distance, calories and average heart rate. Modality, average watts, cadence/RPM, max HR, HR zone, RPE and notes have nowhere to go — today's Assault Bike session cannot be logged faithfully yet.
- **Units are a global preference, not stored per set.** Historic loads have no unit recorded, so switching kg/lb silently reinterprets history.
- **Duplicated state.** Workout data lives in a 1,143-line store, plus a separate program store, dashboard store, progress store, community store, nutrition store and meal-builder store; several fetch overlapping data on each tab switch. Local-only state (dashboard layout, onboarding, "community visited") is in browser storage and lost per device.
- **Dead/parallel systems.** Community channels + likes + threads + announcements sit beside direct messages; the fitness Audit questionnaire, podcast tab, resource library, breathwork/lifestyle and PT invoicing all sit in the main navigation.
- **Profiles are world-readable** to any signed-in user — acceptable for a public community, wrong for a private coaching roster.

## 2. Proposed navigation

Athlete (4 items, bottom bar):
```text
Today   |   Train   |   Nutrition   |   Coach
```
- **Today** — today's session, nutrition targets vs logged, bodyweight prompt, unread coach message.
- **Train** — today's session, week view, full history, movement history and trends.
- **Nutrition** — day log by meal, calories/macros vs target, weight/photo entry.
- **Coach** — one conversation with Andy, plus comments attached to a session or a day's food.

Coach (same app, extra section):
```text
Roster → Client → [Overview | Training | Nutrition | Messages]
```
Roster shows compliance at a glance; client overview shows today/this week, assigned training, nutrition adherence, recent performance and recent messages. Program/template building stays as a focused builder, not a tab maze.

## 3. Data model changes (all additive)

Keep and build on: `workouts`, `workout_exercises`, `exercise_sets`, `conditioning_sets`, `exercise_library`, `programs`, `program_workouts`, `user_program_enrollments`, `user_calendar_workouts`, `user_food_diary`, `user_nutrition_data`, `user_body_entries`, `user_profiles`, `direct_messages`, `user_roles`.

Additions:
- `coach_client_relationships` — real link between coach and athlete, becoming the basis of every permission rule (backfill: Andy ↔ all existing athletes).
- `exercise_sets`: add a unit column (default kg, backfilled to each athlete's current preference) and a tempo/notes field.
- `conditioning_sets`: add modality, average watts, cadence/RPM, max heart rate, HR zone, average speed, RPE and notes.
- Personal records: populate automatically from completed sets (heaviest set, best estimated 1RM per rep range) via a database trigger, and backfill from the 668 existing sets.
- Messaging: add a conversation/thread reference plus an optional link to a workout or food-diary day, and read state.
- Nutrition: daily targets stored per athlete per date so history is honest when targets change.

No table is dropped in this phase.

## 4. Cleanup / deprecation list

Retire from navigation now, keep data untouched, delete only after Andy confirms:
- Fitness Audit questionnaire + results page (7 records — export before retiring).
- Podcast tab and `vault_podcasts` (0 rows).
- Resource library / vault files (16 resources — decide keep-as-"Resources"-link or archive).
- Lifestyle / breathwork section; keep the daily check-in but fold it into Today.
- Community channels, posts, likes, threads, announcements — replaced by coach-client messaging. 8 posts to export.
- Goals panel, wearables, subscriptions/trial logic, PT packages/invoices/sessions (keep invoicing data; drop it from the athlete app).
- Landing/marketing sections, onboarding walkthrough, dashboard "customize/reorder" mode.

## 5. Loading, saving and performance fixes
- One query per screen instead of per-widget; today's session, targets and unread count fetched together.
- Optimistic set logging with a visible saved/failed state and retry — never a silent failure.
- Remove repeat fetching on every tab switch; cache per day.
- Fix the metadata refetch loops in the workout logger; render long histories lazily.
- Consistent error surfaces instead of console-only failures.

## 6. Security / RLS plan
- Rewrite every access rule around `coach_client_relationships` rather than "is admin", so the platform supports more coaches later without a rewrite.
- Give the coach read access to assigned clients' nutrition logs, targets and check-ins (missing today), and write access to assigned training.
- Restrict profile visibility to yourself, your coach and your coach's clients.
- Messaging limited to an existing coach-client pair.
- Re-check grants and policies on every new column/table; run the security scan at the end of each phase.

## 7. Phased implementation (safest order)

1. **Foundation (no user-visible change):** coach-client relationships + backfill, new columns, PR trigger + backfill, permission rewrite. Fully additive.
2. **Athlete Train:** rebuilt session logging — previous performance inline, kg/lb per set, RPE, supersets/circuits, full conditioning metrics. Log the Assault Bike session here as the first real test.
3. **Athlete Today + Nutrition:** the 4-tab shell, daily targets, simple meal logging, bodyweight.
4. **Coach side:** roster, client overview, compliance, assign/program.
5. **Messaging:** one coach-client conversation, read state, comment-on-entry.
6. **Strength analytics:** movement history, estimated 1RM, volume/load/RPE trends.
7. **Cleanup:** remove retired sections from navigation, export archives, then delete deprecated tables on approval.

## 8. Decisions needed from Andy

1. **Coaching model:** Andy-only coach forever, or build multi-coach-ready from day one? (Recommend the latter — same effort now, no rewrite later.)
2. **Community:** delete entirely, or keep a single group channel for all clients alongside private coach chat?
3. **Library / podcast / audit:** archive-and-remove, or keep the library as one simple "Resources" link?
4. **Units:** is kg the default for everyone, with per-athlete override? Any athlete currently logging in lb whose history needs relabelling?
5. **Nutrition depth:** quick manual entry (calories/macros/meal notes/photo) only, or keep the food-database search and barcode scanning?
6. **Check-ins:** keep the daily sleep/stress/energy/drive score on Today, or drop it?
7. **PT packages/invoices:** keep visible to clients, or coach-only admin data?
8. **Conditioning targets:** should the coach be able to prescribe conditioning targets (e.g. "45 min, 150 W") and not just have the athlete log freely?
9. **Confirm the athlete profile** for the Assault Bike session (Andy's own account?) — nothing is written until you confirm.
