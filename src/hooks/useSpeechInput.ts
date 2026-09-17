import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Speech-to-text using the browser's built-in recognition (Chrome, Edge, Safari).
 * No external service and no audio leaves the device.
 *
 * Note: unsupported in Firefox and in some in-app browsers. `supported` is false
 * there and the UI must fall back to typing. A server-side transcription
 * provider would be required to cover every device.
 */
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
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
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<Recognition | null>(null);

  const stop = useCallback(() => {
    ref.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    setError(null);
    const rec = new Ctor();
    rec.lang = navigator.language || "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setTranscript(text.trim());
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
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  useEffect(() => () => ref.current?.stop(), []);

  return { supported, listening, transcript, error, start, stop, reset, setTranscript };
}
