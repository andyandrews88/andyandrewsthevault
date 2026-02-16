

# Admin Dashboard Upgrade: User Profiles, AI Weekly Report, Announcements, and Drill-Down Views

## Overview

Four major features to transform the admin dashboard from a static overview into a fully interactive command center for running the platform solo.

---

## Feature 1: Clickable Stat Cards with Detailed Drill-Down Views

**What it does:** Every stat card on the admin dashboard becomes clickable. Tapping a card opens a detailed drawer/modal showing granular data for that metric.

**Drill-down details per section:**

- **Users cards** (Total, New This Week, New This Month, Active) -- Opens a full user list table with columns: Name, Joined Date, Last Active, Workouts Count, Check-in Streak. Each row is clickable to open the User Profile (Feature 2).
- **Training cards** (Total Workouts, This Week, Avg/User, Total PRs) -- Opens a breakdown showing workout counts by day (bar chart), PR leaderboard, and per-user workout frequency table.
- **Nutrition cards** (Calculator Users, Saved Meals, Audits Done) -- Opens list of users with their nutrition calculator status, meal count, and audit completion.
- **Lifestyle cards** (Check-ins, Body Entries, Goals) -- Opens check-in frequency table, goals progress list with status badges.
- **Community cards** (Posts, Likes) -- Opens recent posts list with engagement metrics, top posters table.
- **Content cards** (Resources, Podcasts) -- Opens content list with view/engagement counts.

**Implementation:**
- Make `StatCard` accept an `onClick` prop
- Create a `AdminDetailDrawer` component using the existing Sheet/Drawer UI
- Create a new edge function `admin-detail` that accepts a `section` parameter and returns detailed data for that section
- The drawer renders different table/chart views based on which card was clicked

---

## Feature 2: Individual User Profile Pages

**What it does:** Click any user's name anywhere in the admin dashboard to open a full profile view showing everything that user has ever done on the platform.

**Profile sections:**
- **Header**: Name, email, join date, days since signup
- **Training**: All workouts listed chronologically, total volume, PR list with dates
- **Check-in History**: Readiness score timeline, streak count, average scores
- **Goals**: All goals with status (active/achieved), progress bars
- **Nutrition**: Calculator data summary, saved meals count, audit results
- **Community**: All posts with like counts, total engagement
- **Body Entries**: Weight history, measurement timeline

**Implementation:**
- New route: `/admin/user/:userId`
- New page: `src/pages/AdminUserProfile.tsx`
- New edge function: `admin-user-profile` -- accepts a `userId`, verifies admin role, returns all data for that user across every table using service role
- Add route to `App.tsx`
- User names in the Recent Signups table and drill-down views become clickable links

---

## Feature 3: Weekly AI Admin Report

**What it does:** An AI-generated summary at the top of the admin dashboard that analyses the past 7 days of platform-wide activity and highlights what needs your attention.

**Report includes:**
- New signup count and trend vs. previous week
- User activity changes (who became inactive, who's on a streak)
- Training trends (popular exercises shifting, volume trends)
- Community engagement changes
- Actionable recommendations ("3 users haven't logged in for 14+ days", "Bench Press is trending up 40% this week")

**Implementation:**
- New edge function: `admin-weekly-report` -- aggregates the same data as `admin-analytics` but for current vs. previous week comparison, then sends it to the Lovable AI gateway (same pattern as `weekly-review`) with a system prompt tailored for platform admin insights
- Uses `google/gemini-3-flash-preview` model (already proven in `weekly-review`)
- New component: `src/components/admin/AdminWeeklyReport.tsx` -- displays in a card at the top of the dashboard with a "Regenerate" button
- Report is generated on-demand (not stored), with loading skeleton while AI processes

---

## Feature 4: Announcement Banner System

**What it does:** Lets you post platform-wide announcements that appear at the top of every user's dashboard. Users can dismiss them individually.

**Admin side:**
- A new "Announcements" section on the admin dashboard
- Form with: title, message (textarea), type (info/warning/success), and active toggle
- List of existing announcements with ability to edit/deactivate/delete

**User side:**
- Active announcements appear as a banner at the top of the Vault Dashboard
- Each banner has a dismiss (X) button
- Dismissed announcements are tracked per-user so they don't reappear
- Multiple announcements stack vertically

**Implementation:**
- New database table: `announcements` with columns: id, title, message, type (info/warning/success), is_active, created_at, updated_at
- New database table: `announcement_dismissals` with columns: id, announcement_id, user_id, dismissed_at
- RLS policies: Anyone authenticated can read active announcements; only admins can insert/update/delete; users can insert their own dismissals
- New component: `src/components/admin/AnnouncementManager.tsx` -- CRUD form on admin dashboard
- New component: `src/components/dashboard/AnnouncementBanner.tsx` -- renders on user dashboard, fetches active announcements minus dismissed ones
- Add `AnnouncementBanner` to `VaultDashboard.tsx` at the very top

---

## Technical Details

### New Database Tables

```sql
-- Announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active announcements
CREATE POLICY "Authenticated users can view active announcements"
  ON public.announcements FOR SELECT
  USING (is_active = true);

-- Only admins can manage
CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Dismissals table
CREATE TABLE public.announcement_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dismissals"
  ON public.announcement_dismissals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can dismiss announcements"
  ON public.announcement_dismissals FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### New Edge Functions

| Function | Purpose |
|----------|---------|
| `admin-user-profile` | Returns full user data across all tables for a given userId |
| `admin-detail` | Returns detailed drill-down data for a given section (users, training, nutrition, etc.) |
| `admin-weekly-report` | Aggregates week-over-week metrics and sends to AI for summary |

All three follow the same auth pattern as `admin-analytics`: verify JWT, check admin role, use service role for data access.

### New Files

| File | Purpose |
|------|---------|
| `src/pages/AdminUserProfile.tsx` | Full user profile view |
| `src/components/admin/AdminDetailDrawer.tsx` | Drill-down drawer for stat cards |
| `src/components/admin/AdminWeeklyReport.tsx` | AI-generated weekly summary card |
| `src/components/admin/AnnouncementManager.tsx` | Admin CRUD for announcements |
| `src/components/dashboard/AnnouncementBanner.tsx` | User-facing banner display |
| `supabase/functions/admin-user-profile/index.ts` | Edge function for user data |
| `supabase/functions/admin-detail/index.ts` | Edge function for section drill-downs |
| `supabase/functions/admin-weekly-report/index.ts` | Edge function for AI report |

### Modified Files

| File | Change |
|------|--------|
| `src/pages/AdminDashboard.tsx` | Make StatCards clickable, add AdminWeeklyReport at top, add AnnouncementManager section |
| `src/components/dashboard/VaultDashboard.tsx` | Add AnnouncementBanner at top |
| `src/App.tsx` | Add `/admin/user/:userId` route |
| `supabase/config.toml` | Add verify_jwt = false for new edge functions |

### Route Structure

```text
/admin                  -- Main admin dashboard (existing, enhanced)
/admin/user/:userId     -- Individual user profile deep-dive (new)
```

