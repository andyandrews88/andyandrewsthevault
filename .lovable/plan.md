

## Plan: Root-cause fix for 3 critical bugs

After deep investigation I found root causes for all three issues. None are surface-level — they're architectural.

---

### Bug 1 — PWA never prompts users to refresh (CRITICAL)

**Root cause:** The `vite-plugin-pwa` "prompt" mode has a known issue where `needRefresh` only fires if the new SW completes installation **and** detects `controller` already exists. In our config:
- `workbox.importScripts: ['/custom-sw.js']` injects custom code, but `skipWaiting` was removed → new SW gets stuck in "waiting" state forever
- The runtime cache rule `urlPattern: /\.(?:js|css)$/` with `NetworkFirst` + 1hr expiration means users keep getting cached JS bundles for up to 60 minutes, hiding the new build hash from the SW
- No registration call exists in `main.tsx` — `useServiceWorkerUpdate` is mounted inside `<App>`, so it only registers AFTER React boots from cached HTML

**Fix (proper, not a patch):**
1. Move SW registration into `main.tsx` so it fires before React renders (matches Notion/Linear pattern)
2. Switch runtime caching for `.js`/`.css` to **`NetworkFirst` with `networkTimeoutSeconds: 3`** and 5-minute max age — this guarantees fresh assets while keeping offline fallback
3. Add a **build-time version stamp** (`__APP_VERSION__` injected via Vite `define`) and check it on app load against the running version — if mismatched, force-show the refresh toast (belt-and-braces)
4. In the SW, add `self.skipWaiting()` listener so `updateServiceWorker(true)` actually activates the new worker
5. Add an explicit "Check for updates" button in Profile Settings so users can manually trigger

Files: `vite.config.ts`, `src/main.tsx`, `src/hooks/useServiceWorkerUpdate.ts`, `public/custom-sw.js`, `src/pages/ProfileSettings.tsx`

---

### Bug 2 — Bodyweight toggle doesn't change UI (root cause: dual source of truth)

**Root cause:** The `ExerciseCard` derives `isBW` from a **hardcoded** function `isBodyweightExercise(name)` that checks a static map in `movementPatterns.ts`. Meanwhile the admin menu writes `equipment_type: 'bodyweight'` to the **DB** — but nothing reads it back. They're two disconnected systems.

Additionally: `isTimed`, `isUnilateral`, `isPlyometric` all properly check DB-first then fallback to hardcoded — but `isBodyweight` does NOT have an `equipmentType` parameter at all.

**Fix (root-cause):**
1. Add `equipment_type` to the batch-fetched `libraryMeta` and the per-exercise fetch in `ExerciseCard`
2. Add new `isBodyweightFromMeta(name, dbEquipmentType)` function in `movementPatterns.ts` — DB value of `'bodyweight'` always wins
3. Pass `equipmentType` through `AdminExerciseMenu` / `ExerciseActionSheet` `onMetadataChange` so the UI updates **immediately** (optimistic) without waiting for re-fetch
4. Extend `ExerciseCard`'s `metadataManuallySet` ref to also handle `equipmentType` so the next DB fetch doesn't overwrite the optimistic state

---

### Bug 3 — Unilateral toggle doesn't restructure the set rows

**Root cause:** Toggling unilateral in admin updates the DB and `isUnilateral` state — but the **existing sets** stay as bilateral (no `side` column). The `addSet` function checks `isUnilateral` only when *creating new* sets. Existing sets render without L/R labels because their `side` is null.

**Fix (root-cause):**
1. When admin toggles `is_unilateral: true`, automatically convert existing bilateral sets — for each set with no side, create a paired left/right set (or prompt user)
2. When toggling `is_unilateral: false`, collapse paired L/R sets back into single sets
3. Add a `convertExerciseUnilaterality(exerciseId, toUnilateral)` action in `workoutStore` that handles the migration in a single DB transaction
4. Wire the admin menu's unilateral toggle to call this conversion immediately after the DB upsert

---

### Bug 4 (bonus) — Duplicate-key error in screenshot

**Root cause:** `exercise_library` has a UNIQUE INDEX on `name` (case-sensitive). Admin menu does `ilike` lookup (case-insensitive) but inserts the exact-case name. So "Half Kneeling Landmine Press" and "Half kneeling landmine press" both exist as separate rows, and a 3rd attempt with a different case throws.

**Fix:** In `upsertExerciseLibraryField`:
1. If `ilike` finds an existing row, update that row (already does this) — but **also** normalize the lookup so we never insert a near-duplicate
2. If insert fails with unique-violation, retry as case-insensitive update
3. (Migration) Convert the unique index to be on `lower(name)` so the DB enforces what the app intends

---

### Files to edit
- `vite.config.ts` — runtime cache strategy, define `__APP_VERSION__`
- `src/main.tsx` — pre-React SW registration + version check
- `src/hooks/useServiceWorkerUpdate.ts` — version-mismatch fallback toast
- `public/custom-sw.js` — `skipWaiting` message listener
- `src/pages/ProfileSettings.tsx` — manual "Check for updates" button
- `src/lib/movementPatterns.ts` — add `isBodyweightFromMeta(name, dbEquipmentType)`
- `src/lib/exerciseLibraryUpsert.ts` — case-insensitive upsert with unique-violation fallback
- `src/components/workout/ExerciseCard.tsx` — fetch + use `equipment_type` from library; wire `equipmentType` through optimistic updates
- `src/components/workout/AdminExerciseMenu.tsx` & `ExerciseActionSheet.tsx` — call new convert action on unilateral toggle; emit `equipmentType` change
- `src/stores/workoutStore.ts` — new `convertExerciseUnilaterality(exerciseId, toUnilateral)` action
- New SQL migration — `CREATE UNIQUE INDEX exercise_library_name_lower_unique ON exercise_library (lower(name))` and drop the old case-sensitive one

### What does NOT change
- No changes to data model fields (only the index)
- No changes to existing completed workout sets' history
- No store/realtime logic outside of unilateral conversion

