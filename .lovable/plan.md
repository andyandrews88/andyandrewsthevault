

## Plan: Rename "Structural Audit" → "Fitness Audit" Everywhere

### Changes (3 files)

**1. `src/components/landing/HeroSection.tsx`** (line 57)
- Change `"Begin Structural Audit"` → `"Begin Fitness Audit"`

**2. `src/components/landing/MeetAndySection.tsx`** (line 28)
- Change `title: "Structural Audit"` → `title: "Fitness Audit"`

**3. `src/components/audit/AuditForm.tsx`** (line 346)
- Change `STRUCTURAL AUDIT` badge → `FITNESS AUDIT`

These are the only 3 places in the entire codebase where "Structural Audit" appears as user-facing text. All other uses of "audit" are internal variable/function names and database references that don't need changing.

