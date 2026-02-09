

# Fix: Knowledge Bank Filtering Not Showing Results

## Problem Analysis

After extensive testing, I identified several issues that could cause filtering problems in the Knowledge Bank:

### Issue 1: Incorrect Category Badge Variants
In `ResourceCard.tsx`, the `categoryVariants` map uses **incorrect category keys**:

| Current (Wrong) | Should Be |
|-----------------|-----------|
| `physics` | `training` |
| `physiology` | `nutrition` |
| `process` | `lifestyle` |

This means category badges don't get the correct styling variant (always falls back to `'data'`).

### Issue 2: Potential Race Condition During Loading
When the component first mounts, there's a brief moment where:
- `isLoading = true`
- `dbResources = []` (empty)
- The component shows "Loading..." but filters still render

If a user clicks a filter during this loading phase, the filtering runs on `staticResources` (fallback), then switches to `dbResources` when loading completes. This could cause a momentary mismatch.

### Issue 3: No Loading State on Filter Results
When data is being fetched, the filter result grid still renders normally. If there's any delay in data loading, users see "0 results" momentarily.

---

## Solution

### 1. Fix Category Variants in ResourceCard.tsx

Update the category-to-variant mapping:

```typescript
const categoryVariants: Record<string, 'data' | 'success' | 'elite'> = {
  training: 'data',
  nutrition: 'success',
  lifestyle: 'elite',
};
```

### 2. Prevent Filtering While Loading

Add a loading check to prevent confusing empty states:

```typescript
// Show loading skeleton during initial fetch
if (isLoading && dbResources.length === 0) {
  return <LoadingSkeleton />;
}
```

### 3. Add Loading Skeleton for Better UX

Show placeholder cards while resources are loading instead of "No resources found".

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/vault/ResourceCard.tsx` | Fix `categoryVariants` mapping |
| `src/components/vault/LibraryTab.tsx` | Add loading state handling before filtering |

---

## Technical Details

### ResourceCard.tsx - Line 25-29

Before:
```typescript
const categoryVariants: Record<string, 'data' | 'success' | 'elite'> = {
  physics: 'data',
  physiology: 'success',
  process: 'elite',
};
```

After:
```typescript
const categoryVariants: Record<string, 'data' | 'success' | 'elite'> = {
  training: 'data',
  nutrition: 'success',
  lifestyle: 'elite',
};
```

### LibraryTab.tsx - Enhanced Loading State

Add skeleton loading state that shows placeholder cards while the database fetch is in progress:

```typescript
// Before the return statement
if (isLoading && dbResources.length === 0) {
  return (
    <>
      {/* Page description header */}
      <div className="text-center mb-6">
        ...
      </div>
      
      <Card variant="elevated">
        <CardHeader>...</CardHeader>
        <CardContent>
          {/* Show 6 skeleton cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
```

---

## Why These Changes Fix the Issue

1. **Category Variants**: Resources now display with correct badge styling, improving visual consistency
2. **Loading Protection**: Users can't accidentally filter on empty data while resources are being fetched
3. **Better UX**: Skeleton loading gives visual feedback that content is loading, preventing confusion about "empty" results

