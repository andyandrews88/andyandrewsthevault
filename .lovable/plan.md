

# Free User Authentication with Data Persistence

## Overview
Add user profiles and authentication so clients can create an account, log in, and have their data (meals, nutrition calculations, audit results) automatically saved and restored when they return. Everything stays completely free - no payment references at all.

---

## What Users Will Experience

1. **Sign Up / Sign In** - Simple email + password registration (free)
2. **Data Syncs to Cloud** - Saved meals, nutrition settings, and audit results persist
3. **Log Out / Log Back In** - Everything is exactly where they left it
4. **Works Across Devices** - Sign in from phone or computer, same data

---

## Changes Summary

### 1. Update Auth Page (Remove Payment References)
The existing auth page mentions "7-day free trial" and "$30/month". Update to reflect free access.

**File:** `src/pages/Auth.tsx`
- Change "Start Trial" tab to "Create Account"
- Remove trial benefits mentioning "7 days free"
- Update button text from "Start Free Trial" to "Create Account"
- Remove any payment-related copy

### 2. Simplify Auth Store
Remove subscription and payment-related code since the app is free.

**File:** `src/stores/authStore.ts`
- Remove Stripe URL constant
- Remove subscription state and fetching
- Remove trial-related computed values
- Keep core auth functions (signIn, signUp, signOut, initialize)

### 3. Add Auth Route Back to App
Re-add the /auth route so users can access the login page.

**File:** `src/App.tsx`
- Import AuthPageWrapper
- Add `/auth` route

### 4. Add User Navigation to Navbar
Add sign in/sign out buttons to the navbar.

**File:** `src/components/layout/Navbar.tsx`
- Show "Sign In" button when logged out
- Show user menu with "Sign Out" when logged in
- Initialize auth on app load

### 5. Create User Data Tables
Create database tables to store user data that currently lives only in local storage.

**New Tables:**
- `user_nutrition_data` - Stores nutrition calculator inputs and results
- `user_meals` - Stores saved meals from the meal builder  
- `user_audit_data` - Stores audit results

### 6. Update Stores to Sync with Database
Modify the Zustand stores to save/load data from the database when a user is logged in.

**Files to Update:**
- `src/stores/nutritionStore.ts` - Add cloud sync for nutrition data
- `src/stores/mealBuilderStore.ts` - Add cloud sync for saved meals
- `src/stores/auditStore.ts` - Add cloud sync for audit results

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useUserDataSync.ts` | Hook to sync local data with database on login |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add /auth route back |
| `src/pages/Auth.tsx` | Remove payment/trial language, make it free signup |
| `src/stores/authStore.ts` | Remove subscription logic, simplify to basic auth |
| `src/components/layout/Navbar.tsx` | Add Sign In/Out buttons + user menu |
| `src/stores/nutritionStore.ts` | Add database sync when user logged in |
| `src/stores/mealBuilderStore.ts` | Add database sync when user logged in |
| `src/stores/auditStore.ts` | Add database sync when user logged in |

---

## Database Structure

### user_nutrition_data
Stores the nutrition calculator inputs and results per user.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| biometrics | jsonb | Weight, height, age, sex, body fat |
| activity | jsonb | Activity level, training days, style |
| goals | jsonb | Primary goal, rate of change |
| dietary | jsonb | Diet type, restrictions, meal frequency |
| results | jsonb | Calculated nutrition results |
| updated_at | timestamp | Last update time |

### user_meals
Stores saved meals from the meal builder.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| name | text | Meal name |
| foods | jsonb | Array of foods with amounts/units |
| totals | jsonb | Calorie and macro totals |
| created_at | timestamp | When meal was saved |

### user_audit_data
Stores audit results.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| data | jsonb | Full audit data (biometrics, lifts, etc) |
| results | jsonb | Calculated results (leaks, scores, tier) |
| updated_at | timestamp | Last update time |

---

## How Data Sync Works

1. **On Login:**
   - Fetch user's saved data from database
   - Merge with local storage (prefer database if exists)
   - Update Zustand stores with fetched data

2. **On Data Change:**
   - If user is logged in, save to database in background
   - Also keep in local storage as backup

3. **On Logout:**
   - Clear local state
   - Data remains safe in database for next login

---

## Security (RLS Policies)

All tables will have Row-Level Security enabled:
- Users can only read/write their own data
- No access to other users' data
- Uses `auth.uid() = user_id` for all policies

---

## Technical Implementation Details

### Auth Initialization
The auth store will initialize on app load via App.tsx, setting up the auth state listener before rendering routes.

### Data Sync Hook
A custom hook `useUserDataSync` will:
- Listen for auth state changes
- On login: fetch and hydrate stores with user data
- On data changes: debounce and save to database
- Handle offline scenarios gracefully (fall back to local storage)

### Optimistic Updates
- UI updates immediately from local state
- Database sync happens in background
- Errors are logged but don't block the UI

