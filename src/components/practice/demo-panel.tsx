import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Pause, Play, RotateCcw, Square, Minus, Plus } from "lucide-react";
import type { NotationData } from "@/data/rudiments";
import { DemoPlayer } from "@/lib/audio/demo-player";
import { BPM_DEFAULT } from "@/lib/audio/metronome";
import { cn } from "@/lib/utils";

export function useDemo(notation: NotationData) {
  const p = useMemo(() => new DemoPlayer(notation, BPM_DEFAULT), [notation]);
  useEffect(() => () => p.dispose(), [p]);
  const snap = useSyncExternalStore(p.subscribe, p.getSnapshot, p.getSnapshot);
  return { p, snap };
}

export function DemoPanel({ p, snap }: ReturnType<typeof useDemo>) {
  const btn = "h-14 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40";
  return (
    <section aria-labelledby="demo-h" className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="demo-h" className="font-semibold">Demonstração</h2>
        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Exemplo sintetizado · não é gravação</span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {snap.state === "running" ? (
          <button type="button" className={cn(btn, "col-span-2 bg-primary text-primary-foreground")} onClick={() => p.pause()}>
            <Pause className="mr-1 inline h-5 w-5" /> Pausar
          </button>
        ) : (
          <button type="button" className={cn(btn, "col-span-2 bg-primary text-primary-foreground")} onClick={() => p.play()}>
            <Play className="mr-1 inline h-5 w-5" /> {snap.state === "paused" ? "Retomar" : "Ouvir"}
          </button>
        )}
        <button type="button" aria-label="Recomeçar" className={cn(btn, "bg-secondary")} onClick={() => p.play(true)}>
          <RotateCcw className="mx-auto h-5 w-5" />
        </button>
        <button type="button" aria-label="Parar demonstração" className={cn(btn, "bg-secondary")} disabled={snap.state === "stopped"} onClick={() => p.stop()}>
          <Square className="mx-auto h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Andamento</span>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Diminuir andamento" className="h-10 w-10 rounded-lg bg-secondary" onClick={() => p.setBpm(snap.bpm - 5)}>
            <Minus className="mx-auto h-4 w-4" />
          </button>
          <span className="w-16 text-center font-mono">{snap.bpm} BPM</span>
          <button type="button" aria-label="Aumentar andamento" className="h-10 w-10 rounded-lg bg-secondary" onClick={() => p.setBpm(snap.bpm + 5)}>
            <Plus className="mx-auto h-4 w-4" />
          </button>
        </div>
      </div>
      {snap.error && <p role="alert" className="mt-3 text-sm text-destructive">{snap.error}</p>}
    </section>
  );
}
