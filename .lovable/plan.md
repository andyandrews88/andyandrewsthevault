

# Superadmin System for Andy Andrews

## Overview
Set you up as the superadmin with full control over all Vault content. You'll be able to edit titles, descriptions, URLs, upload PDFs, and manage all resources directly from the app - no code changes needed.

---

## What You'll Be Able To Do

- Edit any resource (title, description, URL, category, duration)
- Upload new PDFs directly from the app
- Add new videos, podcasts, and articles
- Delete any resource
- Manage podcast episodes
- See an "Admin" badge next to your name
- Access an Admin Panel in the Vault

---

## How It Works

### 1. Superadmin Recognition
When you log in with **andyandrewscf@gmail.com**, the app will:
- Check your role in a secure database table
- Show admin controls on all resource cards (Edit/Delete buttons)
- Display an "Admin Panel" tab in the Vault
- Show a crown/admin badge on your profile

### 2. Inline Editing
Every resource card in the Library will show:
- **Edit button** - Opens a form to change title, description, URL, etc.
- **Delete button** - Removes the resource (with confirmation)

### 3. Admin Panel
A new tab in the Vault just for you:
- **Add New Resource** - Create videos, articles, PDFs, podcasts
- **Upload PDFs** - Drag-and-drop file upload
- **Manage All Resources** - Table view with quick actions
- **Manage Podcast Episodes** - Add/edit/remove episodes

---

## User Interface Preview

```text
+--------------------------------------------------+
|  LIBRARY TAB (Admin View)                        |
|--------------------------------------------------|
|  [+ Add Resource]                    [Admin Panel]|
|                                                  |
|  +----------------+  +----------------+          |
|  | Back Squat     |  | Zone 2 Protocol|          |
|  | Mechanics      |  |                |          |
|  | [Edit] [Delete]|  | [Edit] [Delete]|          |
|  +----------------+  +----------------+          |
+--------------------------------------------------+

+--------------------------------------------------+
|  ADMIN PANEL TAB                                 |
|--------------------------------------------------|
|  Quick Add:                                      |
|  [Video] [PDF] [Article] [Podcast]              |
|                                                  |
|  +----------------------------------------------+|
|  | Title           | Type    | Category | Actions|
|  |-----------------|---------|----------|--------|
|  | Back Squat...   | Video   | Physics  | Edit   |
|  | Zone 2 Protocol | PDF     | Physio   | Edit   |
|  +----------------------------------------------+|
+--------------------------------------------------+
```

---

## Database Changes

### New Tables

| Table | Purpose |
|-------|---------|
| `user_roles` | Stores admin/user roles securely |
| `vault_resources` | All Vault resources (replaces static file) |
| `vault_podcasts` | Podcast episodes (editable) |

### Storage Bucket

| Bucket | Purpose |
|--------|---------|
| `vault-files` | PDF uploads and resource files |

### Security

- Roles stored in separate `user_roles` table (not on profile)
- Admin check uses secure database function
- RLS policies ensure only admins can edit resources
- Regular users can only view resources

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/stores/adminStore.ts` | Admin state management |
| `src/hooks/useAdminCheck.ts` | Hook to check if user is admin |
| `src/components/vault/AdminPanel.tsx` | Admin dashboard |
| `src/components/vault/ResourceEditor.tsx` | Edit resource form |
| `src/components/vault/ResourceUploader.tsx` | PDF/file upload component |
| `src/components/vault/PodcastEditor.tsx` | Edit podcast episodes |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Vault.tsx` | Add Admin Panel tab, pass isAdmin prop |
| `src/components/vault/LibraryTab.tsx` | Add edit/delete buttons for admin |
| `src/components/vault/ResourceCard.tsx` | Show admin actions |
| `src/components/vault/PodcastTab.tsx` | Add admin editing |
| `src/stores/authStore.ts` | Add isAdmin state |
| `src/types/resources.ts` | Add database ID field |

---

## Technical Implementation

### User Roles Table
```text
user_roles:
  - id (uuid)
  - user_id (uuid, references auth.users)
  - role (enum: 'admin', 'moderator', 'user')
  - unique constraint on (user_id, role)
```

### Secure Role Check Function
A database function `has_role(user_id, role)` will:
- Check if user has specified role
- Run with SECURITY DEFINER to bypass RLS
- Prevent recursive policy issues

### Vault Resources Table
```text
vault_resources:
  - id (uuid)
  - title (text)
  - description (text)
  - type (enum: youtube, vimeo, spotify, apple_podcast, article, pdf)
  - category (enum: physics, physiology, process)
  - embed_url (text)
  - content (text, for articles)
  - leak_tags (text[])
  - duration (text)
  - pages (integer)
  - is_premium (boolean)
  - file_path (text, for uploaded PDFs)
  - created_at (timestamp)
  - updated_at (timestamp)
```

### Storage Setup
- Create `vault-files` bucket for PDF uploads
- RLS: Only admins can upload/delete
- Public read access for all files

---

## Seeding Your Admin Account

After you sign up or sign in with **andyandrewscf@gmail.com**, a database migration will:
1. Look up your user ID
2. Insert a row in `user_roles` with role = 'admin'

This is a one-time setup - you'll automatically be recognized as admin on all future logins.

---

## Implementation Order

1. **Phase 1: Database Setup**
   - Create user_roles table with RLS
   - Create has_role() security function
   - Create vault_resources table
   - Create vault_podcasts table
   - Create vault-files storage bucket
   - Seed existing resources from static file

2. **Phase 2: Admin Detection**
   - Add isAdmin to authStore
   - Create useAdminCheck hook
   - Add admin badge to navbar

3. **Phase 3: Resource Management**
   - Create ResourceEditor component
   - Add edit/delete buttons to ResourceCard
   - Update LibraryTab to fetch from database
   - Implement save/delete functions

4. **Phase 4: Admin Panel**
   - Create AdminPanel component
   - Add file upload for PDFs
   - Create PodcastEditor component
   - Add Admin tab to Vault

---

## Note on Your Email
I noticed you typed `andyandrewscf@gmailcom` - I'll use `andyandrewscf@gmail.com` (with the dot before "com"). Let me know if this needs to be different!

