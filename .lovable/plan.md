

# Comprehensive Metrics & Body Tracking System

## Overview

This plan delivers two major interconnected features for your Vault:
1. **Wearable Device Integrations** - Connect Whoop, Garmin, Fitbit, and Apple Health to automatically sync fitness metrics
2. **Body Composition Tracker** - Manual entry system for bodyweight, body fat, measurements, and advanced scans with full visualization

Both features will be built together, with data displayed in interactive charts and tables for easy progress assessment.

---

## Feature 1: Body Composition Tracker

### What Users Can Track

| Category | Metrics |
|----------|---------|
| **Basic** | Bodyweight, calculated BMI, weight trend |
| **Body Fat Methods** | Caliper readings, bioimpedance scale %, visual estimate, Navy method (auto-calculated from measurements) |
| **Advanced Scans** | DEXA results (bone density, lean mass, fat mass by region), InBody readings, Bod Pod data |
| **Circumferences** | Neck, shoulders, chest, waist, hips, biceps, forearms, thighs, calves |

### User Experience

- **New "Progress" tab** in the Vault alongside Library, Nutrition, Podcast, Community, Tracks
- Entry form with date picker and smart defaults (remembers last values)
- Support for both imperial and metric units
- Photo upload option for visual progress tracking
- Quick-add for common entries (just weight) vs detailed entries (full measurements)

### Data Visualization

- **Weight Timeline Chart** - Line graph showing bodyweight over time with trend line
- **Body Composition Pie Chart** - Fat mass vs lean mass breakdown (when scan data available)
- **Measurement Comparison Table** - Side-by-side view of measurements across selected dates
- **Progress Cards** - Weekly/monthly changes with color-coded indicators (green for progress toward goals)

---

## Feature 2: Wearable Device Integrations

### Supported Devices & Data

| Device | Available Metrics |
|--------|-------------------|
| **Whoop** | Recovery score, strain score, HRV, resting heart rate, sleep performance, respiratory rate |
| **Garmin** | Steps, heart rate zones, VO2 max, training load, sleep score, body battery, stress level |
| **Fitbit** | Steps, active minutes, heart rate, sleep stages, cardio fitness score |
| **Apple Health** | Aggregated data from Apple Watch - steps, heart rate, workouts, stand hours |

### Connection Flow

1. User clicks "Connect [Device]" button in Progress tab
2. Redirected to device manufacturer's OAuth authorization page
3. User grants permission to share data
4. Redirected back to your app with connection confirmed
5. Data syncs automatically going forward

### Important Notes on Wearable APIs

- **Whoop, Garmin, Fitbit** all require OAuth 2.0 authentication with client credentials
- **Apple Health** uses a different approach - requires a native iOS companion app or third-party aggregator (Apple doesn't provide a web API)
- Each integration requires registering your app with the device manufacturer and storing API credentials securely

---

## Database Structure

### New Tables

**user_body_entries** - Manual body composition data
- Entry date, weight, body fat %, measurement source (scale, calipers, DEXA, etc.)
- Circumference measurements (waist, hips, chest, etc.)
- Scan-specific fields (lean mass, fat mass, bone density)
- Photo reference (optional)

**user_wearable_connections** - OAuth tokens for connected devices
- Device type (whoop, garmin, fitbit, apple_health)
- Access token, refresh token, expiry timestamp
- Connection status

**user_wearable_data** - Synced metrics from wearables
- Device source, metric type, value, recorded date
- Indexed for efficient charting queries

---

## Technical Architecture

```text
+------------------+     +-----------------------+     +------------------+
|   Progress Tab   |---->|   Body Entry Form     |---->|  Supabase DB     |
|   (Vault)        |     |   + Measurement UI    |     |  body_entries    |
+------------------+     +-----------------------+     +------------------+
        |
        v
+------------------+     +-----------------------+     +------------------+
| Device Connect   |---->|   OAuth Flow          |---->|  Edge Functions  |
| Buttons          |     |   (Backend Handled)   |     |  + Token Storage |
+------------------+     +-----------------------+     +------------------+
        |
        v
+------------------+     +-----------------------+
| Charts & Tables  |<----|  Combined Data Query  |
| (Recharts)       |     |  (Manual + Wearable)  |
+------------------+     +-----------------------+
```

---

## Implementation Phases

### Phase 1: Foundation (First Delivery)
- Database tables and RLS policies
- Body entry form with all measurement types
- Weight chart and basic progress visualization
- Progress tab integrated into Vault

### Phase 2: Advanced Visualization
- Body measurement comparison tables
- Composition pie charts
- Progress photo gallery
- Goal setting and progress indicators

### Phase 3: Wearable Integrations
- OAuth edge functions for each provider
- Device connection UI and status indicators
- Data sync jobs and storage
- Combined charts showing wearable + manual data

---

## API Credential Requirements

For the wearable integrations to work, you'll need to register developer accounts with each platform:

| Platform | Registration URL | What You Get |
|----------|-----------------|--------------|
| Whoop | developer.whoop.com | Client ID + Secret |
| Garmin | developer.garmin.com/gc-developer-program | Consumer Key + Secret |
| Fitbit | dev.fitbit.com | Client ID + Secret |

I'll securely store these credentials as backend secrets once you provide them. Apple Health requires a different approach (iOS app) which we can discuss as a future enhancement.

---

## UI Preview

The Progress tab will include:
- **Overview section** - Current weight, body fat, key wearable metrics in cards
- **Connected Devices** - Icons showing which wearables are synced
- **Entry History** - Recent entries with quick edit/delete
- **Charts Section** - Toggle between weight, body fat, measurements, and wearable metrics
- **Add Entry Button** - Opens modal for new measurements

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/components/progress/ProgressTab.tsx` | Main tab component |
| `src/components/progress/BodyEntryForm.tsx` | Entry form with all fields |
| `src/components/progress/WeightChart.tsx` | Weight timeline visualization |
| `src/components/progress/MeasurementTable.tsx` | Comparison table |
| `src/components/progress/WearableConnect.tsx` | Device connection UI |
| `src/stores/progressStore.ts` | Zustand store for progress data |
| `src/types/progress.ts` | TypeScript types |
| `supabase/functions/whoop-auth/` | Whoop OAuth handler |
| `supabase/functions/garmin-auth/` | Garmin OAuth handler |
| `supabase/functions/fitbit-auth/` | Fitbit OAuth handler |

