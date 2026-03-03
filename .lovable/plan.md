

# Plan: PWA Web Push Notifications

## What This Gives You

When you create or activate an announcement from your admin panel, every user who has granted notification permission will receive a browser push notification — even if the app is closed. Tapping the notification opens the app. This is completely free with no third-party services required.

## How It Works

```text
Admin creates announcement
        │
        ▼
Edge function "send-push" fires
        │
        ▼
Reads all push subscriptions from DB
        │
        ▼
Sends Web Push to each subscriber
        │
        ▼
User's phone/desktop shows notification
```

## Implementation Steps

### 1. Database: Push Subscriptions Table
Create a `push_subscriptions` table to store each user's browser push subscription (endpoint, keys). RLS: users can insert/delete/view their own subscriptions. Admins can read all (needed for sending).

### 2. Generate VAPID Keys
Web Push requires a VAPID key pair. Generate once, store the private key as a backend secret (`VAPID_PRIVATE_KEY`), and the public key as `VITE_VAPID_PUBLIC_KEY` in the codebase (it's a publishable key, safe to expose).

### 3. Service Worker: Push Event Handler
Add a `push` event listener to the service worker that displays the notification when received. Since we use `vite-plugin-pwa`, we'll add a custom service worker file that extends the generated one. This handles displaying the notification and opening the app on click.

### 4. Client: Permission Request + Subscription
Create a `useWebPush` hook that:
- Checks if push is supported
- Requests notification permission
- Subscribes the browser and saves the subscription to the database
- Shows a prompt in the app (e.g., a banner or button in notification settings)

### 5. Edge Function: `send-push`
A new edge function that:
- Accepts a title + message payload
- Reads all subscriptions from the DB (using service role key)
- Sends a Web Push to each using the `web-push` protocol
- Cleans up expired/invalid subscriptions

### 6. Admin Integration
Wire the existing `AnnouncementManager` to call the `send-push` edge function when an announcement is created or activated. Add a "Send Push" toggle/button so you control which announcements also trigger a push.

### 7. User-Facing: Notification Settings Update
Add a "Push notifications" toggle to the existing `NotificationSettings` panel. When enabled, it requests permission and subscribes. When disabled, it unsubscribes.

## Files to Create
- `supabase/functions/send-push/index.ts` — edge function
- `public/custom-sw.js` — push event handler for service worker

## Files to Modify
- `vite.config.ts` — point PWA to custom service worker import
- `src/stores/notificationStore.ts` — add push subscription logic
- `src/components/vault/NotificationSettings.tsx` — add push toggle
- `src/components/admin/AnnouncementManager.tsx` — add "send push" option

## Limitations to Be Aware Of
- **iOS Safari**: Web push works on iOS 16.4+ only if the PWA is added to home screen. Not all your iOS users will get notifications.
- **Android Chrome**: Works reliably, even when app is closed.
- **Desktop**: Works on Chrome, Edge, Firefox.
- Users must explicitly grant permission — you can't force it.

## No Cost
VAPID keys are self-generated. The Push API is a free browser standard. The edge function runs on your existing backend. Zero external services needed.

