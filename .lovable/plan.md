
# 7-Day Free Trial Subscription System

## Overview
Implement a complete trial-based subscription system where users sign up for a free 7-day trial with full Vault access. After the trial expires, they are redirected to the Stripe payment link to continue their subscription.

---

## User Flow

```text
+-------------------+     +------------------+     +-------------------+
|   Home Page       |     |   Auth Page      |     |   Vault Access    |
|   "Start Free     | --> |   Sign Up with   | --> |   Full access     |
|    Trial" button  |     |   email/password |     |   for 7 days      |
+-------------------+     +------------------+     +-------------------+
                                                           |
                                                           v
                                                  +-------------------+
                                                  |  After 7 days:    |
                                                  |  Redirect to      |
                                                  |  Stripe payment   |
                                                  +-------------------+
```

---

## What You Need to Do First

Before I can implement this, you'll need to enable Supabase/Lovable Cloud:
- This is required to store user accounts and track trial start dates
- It will create a database to manage user subscriptions
- Without it, we cannot persist user data between sessions

---

## Implementation Steps

### Step 1: Enable Supabase
- Set up Lovable Cloud to get authentication and database capabilities

### Step 2: Create Database Table
Create a `user_subscriptions` table to track:
- User ID
- Trial start date
- Subscription status (trial, active, expired)
- Stripe customer ID (for future payment integration)

### Step 3: Update Auth Page
- Update messaging to emphasize "7-day free trial" and "$30/month after trial"
- Connect sign-up form to Supabase authentication
- Automatically create subscription record with trial start date on sign-up
- Add proper error handling and input validation

### Step 4: Create Auth Context/Store
- Create an authentication store to manage user session globally
- Track logged-in state across the app
- Calculate trial status (active, expired) based on trial start date

### Step 5: Protect Vault Access
- Add trial expiration check when accessing `/vault`
- If trial expired and not subscribed:
  - Show a modal explaining trial has ended
  - Redirect to Stripe payment link: `https://buy.stripe.com/6oU6oHa8VaojfAt1AFenS0F`
- If trial active: Allow full access with countdown showing days remaining

### Step 6: Update Navbar
- Show user email/name when logged in
- Replace "Sign In/Get Started" with "My Account" or "Sign Out"
- Add visual indicator of trial status

---

## Database Schema

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference to auth.users |
| trial_started_at | timestamp | When the 7-day trial began |
| subscription_status | enum | 'trial', 'active', 'expired', 'cancelled' |
| stripe_customer_id | text | For future Stripe webhook integration |
| created_at | timestamp | Record creation time |

---

## Technical Details

### Trial Calculation Logic
```text
Trial Active = (current_date - trial_started_at) < 7 days
Days Remaining = 7 - (current_date - trial_started_at)
```

### Protected Route Logic
```text
1. Check if user is authenticated
2. If not authenticated → redirect to /auth
3. If authenticated, check subscription status:
   - If 'trial' → check if still within 7 days
   - If trial expired → redirect to Stripe payment link
   - If 'active' → allow full access
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| src/lib/supabase.ts | Create | Supabase client configuration |
| src/stores/authStore.ts | Create | Global auth state management with Zustand |
| src/pages/Auth.tsx | Modify | Connect to real Supabase auth, update messaging |
| src/components/ProtectedRoute.tsx | Create | Wrapper component for trial/subscription checks |
| src/pages/VaultPage.tsx | Modify | Wrap with ProtectedRoute |
| src/components/layout/Navbar.tsx | Modify | Show auth state and trial countdown |
| src/components/TrialExpiredModal.tsx | Create | Modal shown when trial expires |

---

## Next Steps

To proceed, please enable Supabase/Lovable Cloud. Once enabled, I'll implement the complete system including:
1. Database migration for the subscriptions table
2. Authentication with email/password
3. Trial tracking and expiration logic
4. Protected routes with Stripe redirect
