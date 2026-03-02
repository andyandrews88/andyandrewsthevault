

# Plan: PT Package & Invoice Improvements

## Changes to `src/components/admin/PTSessionTracker.tsx`

### 1. Free-text session count input
Replace the preset dropdown (lines 392-401) with a simple number `<Input>` so you can type any number of sessions (e.g. 7, 12, 23 — whatever you sell).

### 2. Multi-currency invoice support
- Add `invCurrency` state (default `"AUD"`)
- Replace the "Amount (AUD)" label and 2-column grid with a 3-column grid: Amount | Currency (AUD/USD/LKR dropdown) | Status
- Pass `invCurrency` into the insert call instead of hardcoded `"AUD"`
- Update the reset after save to reset currency back to `"AUD"`

### 3. Invoice table display fix
Update the invoice amount display (line 354) to use `inv.currency` symbol mapping: `$` for AUD/USD, `Rs` for LKR.

### Files modified
| File | Change |
|------|--------|
| `src/components/admin/PTSessionTracker.tsx` | Replace session dropdown with number input; add currency selector to invoice form |

No database changes needed — the `currency` column already exists on `pt_invoices`.

