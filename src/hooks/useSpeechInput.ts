import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Speech-to-text using the browser's built-in recognition (Chrome, Edge, Safari).
 * No external service and no audio leaves the device.
 *
 * Note: unsupported in Firefox and in some in-app browsers. `supported` is false
 * there and the UI must fall back to typing. A server-side transcription
 * provider would be required to cover every device.
 */
type RecognitionResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => Recognition) | null;
}

export function useSpeechInput() {
  const [supported] = useState(() => !!getRecognitionCtor());
  const [listening, setListening] = useState(false);
  /** Finalised utterances only. Interim recognition text is never exposed. */
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<Recognition | null>(null);
  /** Guards against the same finalised result being appended twice. */
  const seen = useRef<Set<number>>(new Set());

  const teardown = useCallback(() => {
    const rec = ref.current;
    if (!rec) return;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    try {
      rec.abort ? rec.abort() : rec.stop();
    } catch {
      /* already stopped */
    }
    ref.current = null;
  }, []);

  const stop = useCallback(() => {
    try {
      ref.current?.stop();
    } catch {
      /* already stopped */
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    // Always begin from a clean recogniser and empty buffers so nothing from a
    // previous attempt can be concatenated onto this one.
    teardown();
    seen.current = new Set();
    setTranscript("");
    setError(null);
    const rec = new Ctor();
    rec.lang = navigator.language || "en-GB";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let added = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r?.isFinal || seen.current.has(i)) continue;
        seen.current.add(i);
        added += `${r[0].transcript} `;
      }
      const clean = added.trim();
      if (!clean) return;
      setTranscript((prev) => (prev ? `${prev} ${clean}` : clean));
    };
    rec.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "Microphone access was blocked."
          : "Could not hear that. Try again or type it."
      );
      setListening(false);
    };
    rec.onend = () => setListening(false);
    ref.current = rec;
    rec.start();
    setListening(true);
  }, [teardown]);

  const reset = useCallback(() => {
    seen.current = new Set();
    setTranscript("");
    setError(null);
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  return { supported, listening, transcript, error, start, stop, reset, setTranscript };
}

