
# Lifestyle Diagnostic Section Implementation

## Overview
Add a new step to the Audit flow that collects lifestyle data (Sleep, Protein, Stress, Experience) and integrates it into the leak detection logic for the Structural Integrity Report.

---

## Current Flow (4 Steps)
1. Biometrics (Weight, Age, Height)
2. The Big 4 (Strength lifts)
3. Engine Check (Mile run time)
4. Review (Confirm data)

## New Flow (5 Steps)
1. Biometrics (Weight, Age, Height)
2. The Big 4 (Strength lifts)
3. Engine Check (Mile run time)
4. **Lifestyle Diagnostic** (NEW - Sleep, Protein, Stress, Experience)
5. Review (Confirm data)

---

## Changes

### 1. Update Data Model (`auditStore.ts`)

Add new lifestyle fields to `AuditData` interface:

```text
// Lifestyle Diagnostic
sleep: '<6' | '6-7' | '7-8' | '8+';
protein: 'yes' | 'no' | 'unsure';
stress: number;        // 1-10 scale
experience: '<1' | '1-3' | '3-5' | '5+';
```

### 2. Add New Logic Gates (`auditStore.ts`)

**Systemic Recovery Leak:**
- Condition: `sleep === '<6' AND stress > 8`
- Severity: Critical if both conditions are extreme, Warning otherwise
- Links to Recovery/Stress Management resources

**Foundation Track Override:**
- Condition: `experience === '<1'`
- Effect: Override tier recommendation to suggest "Foundation" track regardless of physical metrics
- Add advisory note in results

### 3. Update Audit Form (`AuditForm.tsx`)

Add new step with 4 minimalist, data-focused inputs:

| Question | Input Type | Options |
|----------|------------|---------|
| Average hours of sleep per night? | Dropdown | <6, 6-7, 7-8, 8+ |
| 1.6g protein per kg daily? | Toggle Group | Yes / No / Unsure |
| Non-training stress level? | Slider | 1-10 with visual indicators |
| Years of consistent training? | Dropdown | <1, 1-3, 3-5, 5+ |

Update step array:
- Add `lifestyle` step with `Heart` icon between Engine Check and Review
- Update validation to include lifestyle fields
- Update Review step to display lifestyle data

### 4. Update Results Display (`ResultsPage.tsx`)

- Display new "Systemic Recovery Leak" in the leaks section when triggered
- Add resource links section for Recovery and Stress Management content
- Show "Foundation Track Recommended" advisory for beginners (<1 year experience)
- Include placeholder links for Andy's articles/podcasts

---

## Technical Details

### New Leak Object Structure
```text
{
  id: 'systemic-recovery',
  title: 'Systemic Recovery Leak',
  description: 'Sleep deprivation (<6hrs) combined with high stress (>8/10) is compromising recovery capacity',
  severity: 'critical' | 'warning',
  metric: 'Sleep: <6h | Stress: 9/10',
  recommendation: 'Prioritize sleep hygiene and stress management before increasing training volume...',
  resourceLinks: [
    { title: 'Recovery Protocol', url: '#' },
    { title: 'Stress Management Guide', url: '#' }
  ]
}
```

### Foundation Override Logic
```text
if (experience === '<1') {
  // Add advisory to results
  results.foundationRecommended = true;
  results.foundationReason = 'With less than 1 year of consistent training, 
    the Foundation track ensures long-term structural integrity';
}
```

### UI Components Used
- `Select` component for dropdowns (Sleep, Experience)
- `ToggleGroup` for Yes/No/Unsure (Protein)
- `Slider` component for stress level (1-10)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/stores/auditStore.ts` | Add lifestyle fields to interface, add new logic gates, update tier logic |
| `src/components/audit/AuditForm.tsx` | Add lifestyle step, update steps array, add validation, update review display |
| `src/components/audit/ResultsPage.tsx` | Display new leak type, add resource links, show Foundation recommendation |

---

## Visual Design Notes

The Lifestyle Diagnostic step will maintain the existing "Industrial-Elite" dark mode aesthetic:
- Clean, minimal layout with clear labels
- Monospace font for data values
- Slider with numeric indicator showing current value
- Dropdowns with solid background (not transparent)
- Toggle buttons with clear active/inactive states
