import { useCallback, useEffect, useRef, useState } from "react";

export type TimerState = "idle" | "running" | "paused";

/** Wall-clock practice timer, independent of audio. */
export function useSessionTimer() {
  const [state, setState] = useState<TimerState>("idle");
  const [elapsedMs, setElapsed] = useState(0);
  const acc = useRef(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (state !== "running") return;
    const id = setInterval(() => setElapsed(acc.current + (performance.now() - (startedAt.current ?? performance.now()))), 250);
    return () => clearInterval(id);
  }, [state]);

  const start = useCallback(() => {
    startedAt.current = performance.now();
    setState("running");
  }, []);
  const pause = useCallback(() => {
    if (startedAt.current !== null) acc.current += performance.now() - startedAt.current;
    startedAt.current = null;
    setElapsed(acc.current);
    setState("paused");
  }, []);
  const reset = useCallback(() => {
    acc.current = 0;
    startedAt.current = null;
    setElapsed(0);
    setState("idle");
  }, []);
  const read = useCallback(
    () => acc.current + (startedAt.current !== null ? performance.now() - startedAt.current : 0),
    [],
  );

  return { state, elapsedMs, start, pause, reset, read };
}

export function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
