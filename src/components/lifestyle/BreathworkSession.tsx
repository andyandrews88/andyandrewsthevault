import { useState, useEffect, useRef, useCallback } from "react";
import { X, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BreathworkMethod } from "@/data/breathworkMethods";
import {
  WIM_HOF_POWER_BREATHS,
  WIM_HOF_RETENTION_SECONDS,
  WIM_HOF_RECOVERY_HOLD_SECONDS,
} from "@/data/breathworkMethods";

interface Props {
  method: BreathworkMethod;
  onClose: () => void;
}

// Web Audio tone generator
function playTone(frequency: number, duration = 0.25) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

const phaseFrequencies: Record<string, number> = {
  Inhale: 528,
  "Inhale Left": 528,
  "Inhale Right": 528,
  Hold: 396,
  Exhale: 320,
  "Exhale Left": 320,
  "Exhale Right": 320,
};

type SessionState = "countdown" | "breathing" | "wim-power" | "wim-hold" | "wim-recovery" | "complete";

export function BreathworkSession({ method, onClose }: Props) {
  const isWimHof = method.id === "wim-hof";

  const [state, setState] = useState<SessionState>("countdown");
  const [countdownVal, setCountdownVal] = useState(3);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [round, setRound] = useState(1);
  const [paused, setPaused] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [elapsedTotal, setElapsedTotal] = useState(0);

  // Wim Hof specific
  const [wimBreathCount, setWimBreathCount] = useState(0);
  const [wimHoldTimer, setWimHoldTimer] = useState(0);
  const [wimRecoveryTimer, setWimRecoveryTimer] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const audioRef = useRef(audioOn);
  audioRef.current = audioOn;

  const playPhoneTone = useCallback((phaseName: string) => {
    if (!audioRef.current) return;
    playTone(phaseFrequencies[phaseName] ?? 440);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Countdown
  useEffect(() => {
    if (state !== "countdown") return;
    const id = setInterval(() => {
      setCountdownVal((v) => {
        if (v <= 1) {
          clearInterval(id);
          startTimeRef.current = Date.now();
          if (isWimHof) {
            setState("wim-power");
            setWimBreathCount(0);
          } else {
            setState("breathing");
            setPhaseIndex(0);
            setPhaseTimer(method.phases[0].duration);
            playPhoneTone(method.phases[0].name);
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state, isWimHof, method.phases, playPhoneTone]);

  // Standard breathing
  useEffect(() => {
    if (state !== "breathing" || paused) return;
    const id = setInterval(() => {
      setElapsedTotal((Date.now() - startTimeRef.current) / 1000);
      setPhaseTimer((t) => {
        if (t <= 1) {
          // Next phase
          const nextIdx = phaseIndex + 1;
          if (nextIdx >= method.phases.length) {
            // Next round
            if (round >= method.rounds) {
              setState("complete");
              clearInterval(id);
              return 0;
            }
            setRound((r) => r + 1);
            setPhaseIndex(0);
            setPhaseTimer(method.phases[0].duration);
            playPhoneTone(method.phases[0].name);
            return method.phases[0].duration;
          }
          setPhaseIndex(nextIdx);
          playPhoneTone(method.phases[nextIdx].name);
          return method.phases[nextIdx].duration;
        }
        return t - 1;
      });
    }, 1000);
    intervalRef.current = id as unknown as number;
    return () => clearInterval(id);
  }, [state, paused, phaseIndex, round, method, playPhoneTone]);

  // Wim Hof power breathing
  useEffect(() => {
    if (state !== "wim-power" || paused) return;
    const cycleDuration = (method.phases[0].duration + method.phases[1].duration) * 1000;
    const id = setInterval(() => {
      setElapsedTotal((Date.now() - startTimeRef.current) / 1000);
      setWimBreathCount((c) => {
        const next = c + 1;
        if (next >= WIM_HOF_POWER_BREATHS) {
          setState("wim-hold");
          setWimHoldTimer(WIM_HOF_RETENTION_SECONDS);
          playPhoneTone("Hold");
          clearInterval(id);
          return next;
        }
        playPhoneTone(next % 2 === 0 ? "Inhale" : "Exhale");
        return next;
      });
    }, cycleDuration);
    return () => clearInterval(id);
  }, [state, paused, method.phases, playPhoneTone]);

  // Wim Hof retention hold
  useEffect(() => {
    if (state !== "wim-hold" || paused) return;
    const id = setInterval(() => {
      setElapsedTotal((Date.now() - startTimeRef.current) / 1000);
      setWimHoldTimer((t) => {
        if (t <= 1) {
          setState("wim-recovery");
          setWimRecoveryTimer(WIM_HOF_RECOVERY_HOLD_SECONDS);
          playPhoneTone("Inhale");
          clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state, paused, playPhoneTone]);

  // Wim Hof recovery
  useEffect(() => {
    if (state !== "wim-recovery" || paused) return;
    const id = setInterval(() => {
      setElapsedTotal((Date.now() - startTimeRef.current) / 1000);
      setWimRecoveryTimer((t) => {
        if (t <= 1) {
          if (round >= method.rounds) {
            setState("complete");
          } else {
            setRound((r) => r + 1);
            setState("wim-power");
            setWimBreathCount(0);
          }
          clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state, paused, round, method.rounds, playPhoneTone]);

  // Determine circle scale & label
  let circleScale = 0.6;
  let phaseLabel = "";
  let timerDisplay = 0;
  let instruction = "";

  if (state === "countdown") {
    circleScale = 0.5;
    phaseLabel = "Get Ready";
    timerDisplay = countdownVal;
  } else if (state === "breathing") {
    const phase = method.phases[phaseIndex];
    phaseLabel = phase.name;
    instruction = phase.instruction;
    timerDisplay = phaseTimer;
    const isInhale = phase.name.toLowerCase().includes("inhale");
    const isExhale = phase.name.toLowerCase().includes("exhale");
    circleScale = isInhale ? 1 : isExhale ? 0.6 : 0.8;
  } else if (state === "wim-power") {
    const isIn = wimBreathCount % 2 === 0;
    phaseLabel = isIn ? "Inhale" : "Exhale";
    instruction = isIn ? "Deep powerful breath IN" : "Let it fall out";
    timerDisplay = WIM_HOF_POWER_BREATHS - wimBreathCount;
    circleScale = isIn ? 1 : 0.6;
  } else if (state === "wim-hold") {
    phaseLabel = "Hold";
    instruction = "Hold after exhale — relax";
    timerDisplay = wimHoldTimer;
    circleScale = 0.5;
  } else if (state === "wim-recovery") {
    phaseLabel = "Recovery Breath";
    instruction = "Deep breath in and hold";
    timerDisplay = wimRecoveryTimer;
    circleScale = 0.9;
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (state === "complete") {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-6">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-24 h-24 mx-auto rounded-full bg-success/20 border-2 border-success flex items-center justify-center">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Session Complete</h2>
          <p className="text-muted-foreground">{method.name} — {method.rounds} rounds</p>
          <p className="font-mono text-primary text-lg">{formatTime(elapsedTotal)} total</p>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  // Determine transition duration for the circle animation
  const currentPhaseDuration = state === "breathing" ? method.phases[phaseIndex]?.duration ?? 2 : state === "wim-power" ? 1 : 2;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
      {/* Radial gradient background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, hsl(192 91% 54% / 0.06) 0%, transparent 70%)" }} />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Round <span className="font-mono text-primary">{round}</span> of <span className="font-mono">{method.rounds}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setAudioOn((v) => !v)}>
            {audioOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80">
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/40"
          style={{
            transform: `scale(${circleScale})`,
            transition: `transform ${currentPhaseDuration}s ease-in-out`,
            boxShadow: `0 0 ${circleScale > 0.7 ? 60 : 20}px hsl(192 91% 54% / ${circleScale > 0.7 ? 0.3 : 0.1})`,
          }}
        />
        <div
          className="absolute inset-4 rounded-full bg-primary/5 border border-primary/20"
          style={{
            transform: `scale(${circleScale})`,
            transition: `transform ${currentPhaseDuration}s ease-in-out`,
          }}
        />
        <div className="relative z-10 text-center">
          <p className="text-lg font-semibold text-foreground mb-1">{phaseLabel}</p>
          <p className="font-mono text-4xl text-primary data-glow">{timerDisplay}</p>
        </div>
      </div>

      {/* Instruction */}
      <p className="mt-6 text-sm text-muted-foreground text-center max-w-xs min-h-[2.5rem]">{instruction}</p>

      {/* Controls */}
      <div className="mt-8 flex gap-3">
        {state !== "countdown" && (
          <Button variant="outline" size="lg" onClick={() => setPaused((v) => !v)}>
            {paused ? <Play size={18} /> : <Pause size={18} />}
            {paused ? "Resume" : "Pause"}
          </Button>
        )}
        <Button variant="ghost" size="lg" onClick={onClose}>
          End Session
        </Button>
      </div>

      {/* Elapsed */}
      <p className="mt-4 font-mono text-xs text-muted-foreground">{formatTime(elapsedTotal)}</p>
    </div>
  );
}
