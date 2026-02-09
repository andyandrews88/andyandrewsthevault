

# Redesign Home Page: Tell the Story of The Vault

## Overview

Replace the current generic "Performance Architect" landing page with a compelling narrative that explains **what The Vault actually is, why it exists, and the philosophy behind it**. The current page reads like a corporate landing page for a coaching service. The new version will feel personal, purposeful, and clear about what users are getting.

## Current Problems

- The hero section says "The Vault" and "Performance Architecture" but never explains what it is
- The "Meet Andy" section talks about credentials but not the **why** behind the project
- There's no mention of the actual tools: training logs, nutrition tracking, knowledge bank, progress tracking
- It feels like a sales page rather than an invitation into a free resource

## New Page Structure

The page will flow in 3 sections:

### Section 1: Hero (Revised)
Keep the logo, badge, and visual effects. Replace the tagline and subtitle with copy that immediately communicates the core idea:

**Headline:** "One Place. Everything You Need."

**Subtext:** A single sentence capturing the philosophy -- stop juggling five apps to manage your health. The Vault is your training, nutrition, and lifestyle hub, built on first principles and completely free.

Keep the two CTA buttons (Begin Structural Audit / Access The Vault). Remove the stats bar (1,247+ athletes, 94% leak detection, 6x champion) -- these feel like marketing filler and don't tell users what the app does.

### Section 2: What Is The Vault (New Section - replaces MeetAndySection)
A new `WhyTheVault` section with two halves:

**Left side -- The Philosophy (personal narrative):**
A candid, first-person-flavored explanation blending Andy's voice with editorial perspective:

- The frustration of needing separate apps for nutrition, sleep, training, and progress
- The belief that health and performance should be tracked from **one central place**, built on first principles -- not trends
- The vision of a "second brain" where a decade of coaching knowledge lives as a free, open resource for anyone who needs it
- The ethos: simplicity over complexity, principles over fads

**Right side -- What's Inside (feature cards):**
Replace the abstract "Precision Diagnostics / Evidence-Based Protocols / Structured Progression" cards with concrete descriptions of what the app actually contains:

1. **Training Log** -- Log workouts, track PRs, visualise volume and strength trends
2. **Nutrition Tracker** -- Calculate macros, scan barcodes, plan meals from 50+ recipes
3. **Knowledge Bank** -- A free library of curated resources on training, nutrition, and lifestyle
4. **Progress Tracking** -- Track bodyweight, body composition, and measurements over time
5. **Structural Audit** -- A diagnostic tool that finds gaps in your training, nutrition, and recovery

### Section 3: Footer
Keep as-is, just update the year from 2024 to 2026.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/HeroSection.tsx` | Update headline, subtext, remove stats bar |
| `src/components/landing/MeetAndySection.tsx` | Full rewrite into "Why The Vault" section with philosophy narrative + feature cards |
| `src/components/landing/Footer.tsx` | Update copyright year to 2026 |

## Detailed Copy Direction

### Hero Subtext (draft)
> "Stop juggling five different apps. The Vault brings your training, nutrition, and lifestyle into one place -- built on first principles, powered by a decade of coaching experience, and free for everyone."

### Philosophy Section (draft tone)
> "I built The Vault because I was tired of the fragmentation. One app for calories. Another for workouts. A spreadsheet for body comp. A notes app for everything I've learned coaching athletes for over a decade. None of them talked to each other, and none of them were built the way I think about performance -- from first principles, not trends.
>
> The Vault is my answer to that. It's a centralised system where you can track your training, dial in your nutrition, and monitor your progress -- all in one place, without the noise. But it's also something else: my second brain. Every piece of knowledge I've gathered as a coach -- the frameworks, the protocols, the lessons learned from working with hundreds of athletes -- lives here as a free resource. No gatekeeping. No paywall on the basics.
>
> This isn't finished. It never will be. I'm building this as a living system that grows with the community that uses it."

### Feature Cards
Each card will have an icon, title, and one-line description that maps directly to a real feature in the app. No abstract marketing language -- just what's there and what it does.

