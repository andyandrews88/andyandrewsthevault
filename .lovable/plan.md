

# Guided Breathwork Section -- Inside the Lifestyle Tab

## Overview

A new "Breathwork" card/section will appear in the Lifestyle tab below the Daily Check-In and Readiness Chart. Users pick a breathing method, read what it does, then launch a full-screen guided session with a visual breathing circle animation, phase labels ("Inhale", "Hold", "Exhale"), a timer, round counter, and optional audio cues -- all built with pure CSS animations and the Web Audio API (no external dependencies needed).

## Breathwork Methods Included

| Method | Purpose | Pattern |
|--------|---------|---------|
| Box Breathing | Calm focus, stress reduction, used by Navy SEALs | 4s in, 4s hold, 4s out, 4s hold |
| 4-7-8 Breathing | Sleep preparation, deep relaxation (Dr. Andrew Weil) | 4s in, 7s hold, 8s out |
| Wim Hof Method | Sympathetic activation, energy, cold tolerance | 30 power breaths (fast in/out), then hold after exhale, recovery breath + hold |
| Physiological Sigh | Rapid stress relief in under 1 minute (Stanford/Huberman) | Double inhale (nose), long exhale (mouth), 3-5 cycles |
| Alternate Nostril (Nadi Shodhana) | Balance, calm, pre-meditation | 4s left in, 4s hold, 4s right out, 4s right in, 4s hold, 4s left out |

## User Flow

```text
Lifestyle Tab
  |-- Daily Check-In (existing)
  |-- Readiness Chart (existing)
  |-- Breathwork Section (NEW)
        |-- Method selection cards (grid of 5 methods)
        |   Each card shows: name, icon, purpose tag, 1-line description
        |
        |-- On card click -> Method detail view
        |   Shows: full description, science/purpose, pattern breakdown
        |   "Begin Session" button
        |
        |-- On "Begin Session" -> Full-screen guided session
            |-- Animated breathing circle (expands/contracts)
            |-- Phase label: "Inhale" / "Hold" / "Exhale"
            |-- Phase timer countdown
            |-- Round counter (e.g., "Round 3 of 4")
            |-- Pause / Stop controls
            |-- Audio cues: gentle tone on phase transitions (Web Audio API)
            |-- Session complete screen with duration summary
```

## New Files

### 1. `src/components/lifestyle/BreathworkSection.tsx`
The main container component. Renders the method selection grid and manages which view is active (selection, detail, or active session).

### 2. `src/components/lifestyle/BreathworkMethodCard.tsx`
A small card for each method showing the name, a purpose badge (e.g., "Relaxation", "Activation"), and a brief description. Clicking opens the detail view.

### 3. `src/components/lifestyle/BreathworkSession.tsx`
The full-screen guided session component. This is the core of the feature:
- Uses `useRef` + `useEffect` with `requestAnimationFrame` or `setInterval` to drive the breathing cycle timer
- CSS `transform: scale()` animation on a circle element, with `transition-duration` dynamically set to match the current phase duration
- Phase label and countdown rendered as overlays on the circle
- Web Audio API `OscillatorNode` plays a short gentle tone (sine wave, ~400Hz, 200ms fade) on each phase transition -- no audio files needed
- Wim Hof mode has a special "power breathing" phase with faster animations before the retention hold
- Pause/resume and stop buttons
- On completion, shows a summary (total time, rounds completed)

### 4. `src/data/breathworkMethods.ts`
Static data file defining each method's metadata and phase sequences:

```typescript
interface BreathPhase {
  name: string;         // "Inhale", "Hold", "Exhale"
  duration: number;     // seconds
  instruction: string;  // "Breathe in slowly through your nose"
}

interface BreathworkMethod {
  id: string;
  name: string;
  purpose: string;      // "Relaxation" | "Activation" | "Sleep" | "Focus" | "Balance"
  shortDescription: string;
  fullDescription: string;
  science: string;      // Why it works
  phases: BreathPhase[];
  rounds: number;       // Default number of rounds
  icon: string;         // Lucide icon name
}
```

## Modified Files

### `src/components/lifestyle/LifestyleTab.tsx`
Add `<BreathworkSection />` as the third section:

```typescript
import { BreathworkSection } from "./BreathworkSection";

export function LifestyleTab() {
  return (
    <div className="space-y-6">
      <DailyCheckin />
      <ReadinessChart />
      <BreathworkSection />
    </div>
  );
}
```

### `src/index.css`
Add keyframes for the breathing circle animation:

```css
@keyframes breathe-in {
  from { transform: scale(0.6); }
  to { transform: scale(1); }
}
@keyframes breathe-out {
  from { transform: scale(1); }
  to { transform: scale(0.6); }
}
```

## Visual Design

The breathing circle will follow the existing design system:
- Circle uses `border-primary` with a subtle `shadow-glow` effect
- During inhale: circle expands with a cyan glow intensifying
- During hold: circle stays still, glow pulses gently
- During exhale: circle contracts, glow dims
- Phase text uses `font-mono` for the countdown timer
- Background uses a subtle radial gradient overlay for immersion in full-screen mode
- Full-screen mode uses a fixed overlay with `bg-background/95 backdrop-blur-xl`

## Audio (No External Files)

Phase transition tones are generated using the Web Audio API:

```typescript
function playTransitionTone(frequency = 396, duration = 0.2) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}
```

Different tones for different phases (lower for exhale, higher for inhale) to provide subtle audio guidance without needing any sound files.

## Summary

| Area | Change |
|------|--------|
| `src/data/breathworkMethods.ts` | New -- method definitions and phase data |
| `src/components/lifestyle/BreathworkSection.tsx` | New -- main container with method grid and detail view |
| `src/components/lifestyle/BreathworkMethodCard.tsx` | New -- individual method selection card |
| `src/components/lifestyle/BreathworkSession.tsx` | New -- full-screen guided session with animation, timer, audio |
| `src/components/lifestyle/LifestyleTab.tsx` | Modified -- add BreathworkSection |
| `src/index.css` | Modified -- add breathing animation keyframes |

No database changes. No new dependencies. Pure client-side feature using CSS animations and Web Audio API.
