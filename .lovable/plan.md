

# Fix: Missing Home & Train Tabs on Mobile

## Root Cause

The `TabsList` was changed to `flex overflow-x-auto` for horizontal scrolling, but the `TabsTrigger` children lack `flex-shrink-0`. On narrow screens, the flex container shrinks the first items (Home, Train) down to zero width instead of allowing horizontal scroll.

## Fix

Add `flex-shrink-0` to every `TabsTrigger` in `src/pages/Vault.tsx` so they maintain their natural width and the container scrolls horizontally as intended.

**File**: `src/pages/Vault.tsx` (lines 84-126)

Each TabsTrigger class gets `flex-shrink-0` added, e.g.:
```
className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] whitespace-nowrap"
```

Single file change, ~10 lines updated.

