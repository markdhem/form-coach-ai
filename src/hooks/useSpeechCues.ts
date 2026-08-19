import { useCallback, useEffect, useRef } from "react";

const COOLDOWN_MS = 2500;

export function useSpeechCues(enabled: boolean) {
  const lastSpoken = useRef<Record<string, number>>({});
  const supported = useRef(false);

  useEffect(() => {
    supported.current = typeof window !== "undefined" && "speechSynthesis" in window;
  }, []);

  useEffect(() => {
    if (!enabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [enabled]);

  const speak = useCallback(
    (phrase: string, cooldown = COOLDOWN_MS) => {
      if (!enabled || !supported.current) return;
      const now = Date.now();
      if (now - (lastSpoken.current[phrase] ?? 0) < cooldown) return;
      lastSpoken.current[phrase] = now;
      try {
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.rate = 1.1;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      } catch {
        // speech is a nicety, never a hard failure
      }
    },
    [enabled],
  );

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, cancel };
}