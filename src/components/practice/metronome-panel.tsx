import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Minus, Pause, Play, Plus, Square, Hand } from "lucide-react";
import { BPM_MAX, BPM_MIN, Metronome, TapTempo, type Subdivision } from "@/lib/audio/metronome";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const SUBS: { v: Subdivision; label: string }[] = [
  { v: 1, label: "♩" },
  { v: 2, label: "♪♪" },
  { v: 3, label: "3" },
  { v: 4, label: "♬♬" },
];

export function useMetronome() {
  const ref = useRef<Metronome | null>(null);
  ref.current ??= new Metronome();
  const m = ref.current;
  useEffect(() => () => m.dispose(), [m]);
  const snap = useSyncExternalStore(m.subscribe, m.getSnapshot, m.getSnapshot);
  return { m, snap };
}

export function MetronomePanel({ m, snap }: ReturnType<typeof useMetronome>) {
  const { settings: s, state } = snap;
  const [draft, setDraft] = useState(String(s.bpm));
  const tap = useRef(new TapTempo());
  useEffect(() => setDraft(String(s.bpm)), [s.bpm]);

  const commit = () => m.update({ bpm: Number(draft) });
  const big = "h-14 min-w-14 rounded-xl text-base font-semibold transition-colors disabled:opacity-40";

  return (
    <section aria-labelledby="metro-h" className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 id="metro-h" className="font-semibold">Metrônomo</h2>
        <span className={cn("font-mono text-xs uppercase", state === "running" ? "text-status-practiced" : "text-muted-foreground")} aria-live="polite">
          {state === "running" ? (snap.countingIn ? "Contagem" : "Tocando") : state === "paused" ? "Pausado" : "Parado"}
        </span>
      </div>

      {/* Beat indicator */}
      <div className="mt-4 flex gap-2" aria-hidden>
        {Array.from({ length: s.beatsPerMeasure }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-4 flex-1 rounded-full bg-muted transition-colors duration-75",
              snap.beat === i && state === "running" && (snap.countingIn ? "bg-status-learning" : i === 0 && s.accentFirst ? "bg-primary" : "bg-foreground"),
            )}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button type="button" aria-label="Diminuir BPM" className={cn(big, "bg-secondary")} onClick={() => m.update({ bpm: s.bpm - 1 })}>
          <Minus className="mx-auto h-5 w-5" />
        </button>
        <label className="text-center">
          <span className="sr-only">BPM</span>
          <input
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="w-28 bg-transparent text-center font-mono text-5xl font-bold text-foreground outline-none"
            aria-describedby="bpm-range"
          />
          <span id="bpm-range" className="block text-xs text-muted-foreground">BPM ({BPM_MIN}–{BPM_MAX})</span>
        </label>
        <button type="button" aria-label="Aumentar BPM" className={cn(big, "bg-secondary")} onClick={() => m.update({ bpm: s.bpm + 1 })}>
          <Plus className="mx-auto h-5 w-5" />
        </button>
      </div>
      <Slider className="mt-4" min={BPM_MIN} max={BPM_MAX} step={1} value={[s.bpm]} onValueChange={([v]) => v !== undefined && m.update({ bpm: v })} aria-label="BPM" />

      <div className="mt-5 grid grid-cols-3 gap-2">
        {state === "running" ? (
          <button type="button" className={cn(big, "col-span-2 bg-primary text-primary-foreground")} onClick={() => m.pause()}>
            <Pause className="mr-2 inline h-5 w-5" /> Pausar
          </button>
        ) : (
          <button type="button" className={cn(big, "col-span-2 bg-primary text-primary-foreground")} onClick={() => m.start()}>
            <Play className="mr-2 inline h-5 w-5" /> {state === "paused" ? "Retomar" : "Iniciar"}
          </button>
        )}
        <button type="button" className={cn(big, "bg-secondary")} disabled={state === "stopped"} onClick={() => m.stop()}>
          <Square className="mr-2 inline h-4 w-4" /> Parar
        </button>
      </div>
      <button
        type="button"
        className={cn(big, "mt-2 w-full border bg-transparent hover:bg-accent")}
        onClick={() => {
          const bpm = tap.current.tap();
          if (bpm) m.update({ bpm });
        }}
      >
        <Hand className="mr-2 inline h-5 w-5" /> Tap tempo
      </button>
      {snap.error && <p role="alert" className="mt-3 text-sm text-destructive">{snap.error}</p>}

      <div className="mt-5 grid gap-4 border-t pt-4 text-sm">
        <div>
          <span className="text-muted-foreground">Subdivisão</span>
          <div role="radiogroup" aria-label="Subdivisão" className="mt-2 grid grid-cols-4 gap-2">
            {SUBS.map((o) => (
              <button
                key={o.v}
                type="button"
                role="radio"
                aria-checked={s.subdivision === o.v}
                aria-label={`${o.v} por tempo`}
                onClick={() => m.update({ subdivision: o.v })}
                className={cn("h-11 rounded-lg border font-mono", s.subdivision === o.v ? "border-primary bg-primary text-primary-foreground" : "bg-secondary")}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Tempos por compasso</span>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Menos tempos" className="h-10 w-10 rounded-lg bg-secondary" onClick={() => m.update({ beatsPerMeasure: s.beatsPerMeasure - 1 })}>−</button>
            <span className="w-6 text-center font-mono">{s.beatsPerMeasure}</span>
            <button type="button" aria-label="Mais tempos" className="h-10 w-10 rounded-lg bg-secondary" onClick={() => m.update({ beatsPerMeasure: s.beatsPerMeasure + 1 })}>+</button>
          </div>
        </div>
        <label className="flex items-center justify-between">
          <span className="text-muted-foreground">Acentuar 1º tempo</span>
          <Switch checked={s.accentFirst} onCheckedChange={(v) => m.update({ accentFirst: v })} />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-muted-foreground">Contagem (1 compasso)</span>
          <Switch checked={s.countIn} onCheckedChange={(v) => m.update({ countIn: v })} />
        </label>
        <div>
          <span className="text-muted-foreground">Volume</span>
          <Slider className="mt-3" min={0} max={100} value={[Math.round(s.volume * 100)]} onValueChange={([v = 0]) => m.update({ volume: v / 100 })} aria-label="Volume do metrônomo" />
        </div>
      </div>
    </section>
  );
}
