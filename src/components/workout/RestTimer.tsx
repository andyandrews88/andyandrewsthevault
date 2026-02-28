import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Timer, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RestTimerProps {
  trigger: number; // increment to auto-start
  defaultSeconds?: number;
  manualOpen?: boolean; // allow manual opening
  onManualClose?: () => void;
}

const PRESETS = [30, 60, 90, 120, 180];

export function RestTimer({ trigger, defaultSeconds = 90, manualOpen, onManualClose }: RestTimerProps) {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Auto-start on trigger change
  useEffect(() => {
    if (trigger > 0) {
      setRemaining(defaultSeconds);
      setTotal(defaultSeconds);
      setIsRunning(true);
      setIsDismissed(false);
      setIsExpanded(false);
    }
  }, [trigger, defaultSeconds]);

  // Manual open support
  useEffect(() => {
    if (manualOpen) {
      setIsDismissed(false);
      setIsExpanded(true);
      if (remaining === 0) {
        setRemaining(defaultSeconds);
        setTotal(defaultSeconds);
      }
    }
  }, [manualOpen]);

  // Countdown logic
  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remaining > 0]);

  const playBeep = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.3);
      }, 350);
    } catch {
      // AudioContext not available
    }
  }, []);

  const handlePreset = (seconds: number) => {
    setRemaining(seconds);
    setTotal(seconds);
    setIsRunning(true);
    setIsExpanded(false);
  };

  const handleDismiss = () => {
    setIsRunning(false);
    setRemaining(0);
    setIsDismissed(true);
    onManualClose?.();
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setRemaining(total);
    setIsRunning(true);
  };

  if (isDismissed) return null;

  const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isFinished = remaining === 0 && !isRunning;

  // Minimized pill
  if (!isExpanded) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 shadow-lg cursor-pointer transition-colors",
            isFinished
              ? "bg-primary text-primary-foreground animate-pulse"
              : "bg-card border border-border text-foreground"
          )}
          onClick={() => setIsExpanded(true)}
        >
          <Timer className="h-4 w-4" />
          <span className="font-mono font-bold text-sm">{timeStr}</span>
          {/* Mini progress bar */}
          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-1"
            onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-4 w-72">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rest Timer</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(false)}>
              <Timer className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismiss}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Circular progress + time */}
        <div className="flex flex-col items-center mb-3">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke={isFinished ? "hsl(var(--primary))" : "hsl(var(--primary))"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                "font-mono text-2xl font-bold",
                isFinished && "text-primary"
              )}>
                {timeStr}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={isRunning ? "outline" : "default"}
            size="icon"
            className="h-10 w-10"
            onClick={togglePause}
            disabled={remaining === 0}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDismiss}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Presets */}
        <div className="flex items-center justify-center gap-1.5">
          {PRESETS.map(s => (
            <Button
              key={s}
              variant={total === s ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => handlePreset(s)}
            >
              {s >= 60 ? `${s / 60}m` : `${s}s`}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
