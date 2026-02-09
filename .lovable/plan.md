

# Tracks Tab Updates

## Overview

Updating the Tracks section in the Vault to add the proper external links and adjust the 1-on-1 coaching card to match the other track cards.

---

## Changes Required

### 1. Foundation Track Card (Lines 164-187)
- Add external link: `https://dashboard.coachrx.app/programs/sales/74471`
- Button will open in new tab

### 2. Performance Track Card (Lines 189-215)
- Change button to show "Coming Soon" state
- Disable the button or style it as unavailable
- Remove the external link functionality

### 3. 1-on-1 Coaching Card (Lines 218-235)
- Redesign to match Foundation/Performance card layout (side-by-side icon + content)
- Add same structure: icon, title, description, bullet points, and button
- Add external link: `https://docs.google.com/forms/d/e/1FAIpQLSeNZfnUe0PaxJFym_OJehlxbNmvbo9SPA6GDd6GIegdIaAD9Q/viewform?usp=header`
- Change from horizontal flex layout to match the card grid pattern

---

## Updated Track Cards Design

**Foundation Track:**
- External link to CoachRx program page
- Button: "Join on CoachRx" (active, opens in new tab)

**Performance Track:**
- Badge changes from "ADVANCED" to "COMING SOON"
- Button text: "Coming Soon"
- Button disabled/muted styling

**1-on-1 Coaching Card:**
- Added to the grid as a third card spanning full width or centered
- Same layout pattern as other track cards
- Crown icon
- Title: "1-on-1 Coaching"
- Description about personalized elite coaching
- Bullet points about what's included
- Button: "Apply Now" linking to Google Form

---

## File to Modify

| File | Changes |
|------|---------|
| `src/pages/Vault.tsx` | Update Tracks tab content with links and new 1-on-1 card layout |

---

## Technical Details

### Foundation Track Button Update
```tsx
<a 
  href="https://dashboard.coachrx.app/programs/sales/74471" 
  target="_blank" 
  rel="noopener noreferrer"
>
  <Button variant="outline" className="w-full">
    <ExternalLink className="w-4 h-4 mr-2" />
    Join on CoachRx
  </Button>
</a>
```

### Performance Track - Coming Soon State
```tsx
<div className="flex items-center gap-2 mb-1">
  <h3 className="font-semibold text-lg">Performance Track</h3>
  <Badge variant="secondary" className="text-xs">COMING SOON</Badge>
</div>
...
<Button variant="outline" className="w-full" disabled>
  Coming Soon
</Button>
```

### 1-on-1 Coaching - New Card Layout
Transform from horizontal CTA to match track card pattern with:
- Same card structure as Foundation/Performance
- Crown icon in icon container
- Full bullet list of coaching benefits
- External link button to Google Form

