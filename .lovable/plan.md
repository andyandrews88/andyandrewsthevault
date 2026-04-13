

## Plan: Rename Nav Link and CTA Button

Two targeted text changes — the app name "The Vault" stays everywhere else.

### Changes

**1. `src/components/layout/Navbar.tsx`** (line 59)
- `"The Vault"` → `"Training"` in the nav links array

**2. `src/components/landing/HeroSection.tsx`** (line 63)
- `"Access The Vault"` → `"Start Training"` on the CTA button

No other files affected — all other references to "The Vault" are about the app/brand name and stay as-is.

