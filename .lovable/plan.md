

# Plan: PT Session Tracker with Invoice Management & PDF Report Generator

## Overview

Build a complete Personal Training session management system on each client's admin dashboard. This includes session logging, package tracking, invoice linking, and a customizable PDF report generator — modeled after best practices from platforms like PTminder, My PT Hub, TrueCoach, and TrainHeroic.

## Database Changes

### New table: `pt_packages`
Tracks purchased PT session packages per client.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| coach_id | uuid | Admin who created it |
| client_user_id | uuid | The client |
| sessions_purchased | integer | Total sessions bought |
| sessions_used | integer | Default 0 |
| package_name | text | e.g. "10-Pack Jan 2026" |
| purchase_date | date | |
| status | text | 'active' / 'completed' / 'expired' |
| notes | text | Optional |
| created_at | timestamptz | |

RLS: Admin-only (full access via `has_role`).

### New table: `pt_sessions`
Logs individual PT session dates, linked to a package.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| package_id | uuid FK → pt_packages | |
| client_user_id | uuid | |
| session_date | date | |
| workout_id | uuid | Optional link to actual workout |
| notes | text | |
| created_at | timestamptz | |

RLS: Admin-only.

### New table: `pt_invoices`
Stores Stripe invoice URLs and payment status.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| package_id | uuid FK → pt_packages | Optional link |
| client_user_id | uuid | |
| invoice_url | text | Stripe invoice link |
| amount | numeric | Invoice amount |
| currency | text | Default 'AUD' |
| status | text | 'paid' / 'pending' / 'overdue' |
| invoice_date | date | |
| notes | text | |
| created_at | timestamptz | |

RLS: Admin-only.

## New Component: `PTSessionTracker`

Location: `src/components/admin/PTSessionTracker.tsx`

A self-contained panel added to `AdminUserProfile.tsx` containing:

1. **Package Summary Card** — Shows active package name, sessions remaining (purchased - used), progress bar, purchase date
2. **Log Session Button** — Date picker (defaults to today), optional link to existing workout, notes field. On save, increments `sessions_used` on the package
3. **Session History Table** — Date, linked workout name, notes. Sorted newest first
4. **Package Management** — Create new package (name, # sessions, purchase date), dropdown or input for session count. View past/completed packages
5. **Invoice Section** — Add invoice URL + amount + status. Table of all invoices for this client. Status badges (green=paid, yellow=pending, red=overdue)
6. **Generate Report Button** — Opens the PDF customization dialog

## New Component: `PTReportGenerator`

Location: `src/components/admin/PTReportGenerator.tsx`

A dialog that asks the coach what to include before generating, with checkboxes:

- **Package Summary** (sessions remaining, package name, dates) — default on
- **Session Log** (list of all PT dates with workout details) — default on
- **Workout Details** (full exercise breakdowns for each session) — default off
- **Invoice Summary** (all invoices, amounts, statuses) — default on
- **Pending Invoices Highlight** — default on
- **Client Profile Info** (name, stats) — default on

Uses browser-native PDF generation approach: renders a hidden styled HTML document and calls `window.print()` with `@media print` styles, or uses a lightweight library. The report will be professionally styled with:
- Coach branding header (The Vault logo)
- Client name and date range
- Clean table layouts for sessions and invoices
- Color-coded status indicators
- Summary statistics at the top
- Footer with generation date

**Industry best practices incorporated:**
- Session countdown prominently displayed (like PTminder)
- Package expiry tracking (like My PT Hub)
- Invoice-to-package linking for financial reconciliation
- Customizable report content (like TrueCoach's client exports)
- Professional formatting suitable for client communication

## Files to Create/Modify

| File | Change |
|------|--------|
| **DB migration** | Create `pt_packages`, `pt_sessions`, `pt_invoices` tables with admin-only RLS |
| `src/components/admin/PTSessionTracker.tsx` | **New** — Full PT management panel |
| `src/components/admin/PTReportGenerator.tsx` | **New** — PDF customization dialog + generation |
| `src/pages/AdminUserProfile.tsx` | Add PTSessionTracker section between Training and Check-ins |

