import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Clock, Flag, Pause, Play, RotateCcw } from "lucide-react";
import { getRudiment, graceLabel } from "@/data/rudiments";
import { FamilyBadge } from "@/components/rudiment-badges";
import { NotationView } from "@/components/notation-view";
import { MetronomePanel, useMetronome } from "@/components/practice/metronome-panel";
import { DemoPanel, useDemo } from "@/components/practice/demo-panel";
import { formatDuration, useSessionTimer } from "@/lib/use-session-timer";
import { cn } from "@/lib/utils";
import { createSession } from "@/lib/sessions/store";
import { MIN_DURATION_MS, toFormValues, type SessionFormValues } from "@/lib/sessions/model";
import { SessionForm } from "@/components/sessions/session-form";
import type { NotationData, Rudiment } from "@/data/rudiments";

export const Route = createFileRoute("/rudimentos_/$id/praticar")({
  loader: ({ params }) => {
    const rudiment = getRudiment(params.id);
    if (!rudiment) throw notFound();
    return { rudiment };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.rudiment.name ?? "Rudimento";
    const title = `Praticar ${name} — Rudiment Lab`;
    const desc = `Pratique o ${name} com partitura, metrônomo, demonstração e cronômetro.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Practice,
});

function Practice() {
  const { rudiment: r } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <Link to="/rudimentos/$id" params={{ id: r.id }} className="inline-flex h-10 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {r.name}
      </Link>
      <header className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold md:text-4xl">{r.name}</h1>
        <FamilyBadge family={r.family} />
      </header>
      {r.notation ? (
        <PracticeArea r={r} notation={r.notation} />
      ) : (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-status-learning" aria-hidden />
          <p>A partitura deste rudimento ainda está pendente de validação, então a prática guiada fica desativada por enquanto.</p>
        </div>
      )}
    </div>
  );
}

function PracticeArea({ r, notation }: { r: Rudiment; notation: NotationData }) {
  const metro = useMetronome();
  const demo = useDemo(notation);
  const timer = useSessionTimer();
  const [draft, setDraft] = useState<SessionFormValues | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const startInfo = useRef<{ at: string; bpm: number } | null>(null);

  // Remember when and at what tempo the timer first started.
  useEffect(() => {
    if (timer.state === "running" && !startInfo.current) startInfo.current = { at: new Date().toISOString(), bpm: metro.snap.settings.bpm };
    if (timer.state === "idle") startInfo.current = null;
  }, [timer.state, metro.snap.settings.bpm]);

  // Warn before leaving with an unsaved draft or running timer.
  const unsaved = !!draft || timer.elapsedMs > 0;
  useEffect(() => {
    if (!unsaved) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [unsaved]);

  // Space toggles the metronome (when not typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.code !== "Space" || ["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(t.tagName) || t.getAttribute("role")) return;
      e.preventDefault();
      if (metro.snap.state === "running") metro.m.pause();
      else void metro.m.start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [metro]);

  const finish = () => {
    const durationMs = timer.read();
    timer.pause();
    metro.m.stop();
    demo.p.stop();
    const fresh = toFormValues({
      rudimentId: r.id,
      startedAt: startInfo.current?.at ?? new Date(Date.now() - durationMs).toISOString(),
      durationMs,
      startBpm: startInfo.current?.bpm ?? null,
      finalBpm: metro.snap.settings.bpm,
    });
    // Keep the user's earlier edits; refresh only the duration.
    setDraft((d) => (d ? { ...d, minutes: fresh.minutes, seconds: fresh.seconds } : fresh));
    setSaved(null);
    setFormOpen(true);
  };

  const discard = () => {
    if (!confirm("Descartar esta sessão sem salvar?")) return;
    setDraft(null);
    setFormOpen(false);
    timer.reset();
  };

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
        <section aria-labelledby="nota-h" className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 id="nota-h" className="font-semibold">Partitura</h2>
            <span className="font-mono text-xs text-muted-foreground">{notation.timeSignature}</span>
          </div>
          <NotationView notation={notation} className="mt-4" />
          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Manulação">
            {notation.events.map((e, i) => (
              <span
                key={i}
                className={cn(
                  "flex h-10 min-w-10 items-center justify-center rounded-md border px-2 font-mono text-sm font-bold",
                  e.rest ? "text-muted-foreground" : e.hand === "R" ? "text-family-rolls" : "text-family-drags",
                  e.triplet && "border-dashed",
                  e.accent && "border-primary",
                  demo.snap.index === i && "bg-primary text-primary-foreground",
                )}
              >
                {graceLabel(e) && <sup className="mr-0.5 text-[10px] font-normal">{graceLabel(e)}</sup>}
                {e.buzz && <span className="mr-0.5 text-[10px] font-normal">~</span>}
                {e.rest ? "–" : e.hand}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Acentos (&gt;) em destaque · letra pequena = nota de enfeite · borda tracejada = tercina · – = pausa · Fonte: {notation.source}
          </p>
        </section>
        <DemoPanel {...demo} />
      </div>

      <div className="min-w-0 space-y-6">
        <section aria-labelledby="timer-h" className="rounded-2xl border bg-card p-5">
          {formOpen && draft ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 id="timer-h" className="font-semibold">Registrar sessão</h2>
                <span className="rounded-full bg-status-learning/20 px-2 py-0.5 text-xs font-medium text-status-learning">Rascunho · não salvo</span>
              </div>
              <SessionForm
                values={draft}
                onChange={setDraft}
                lockRudiment
                cancelLabel="Voltar à prática"
                onCancel={() => setFormOpen(false)}
                onSubmit={async (input) => {
                  await createSession(input);
                  setDraft(null);
                  setFormOpen(false);
                  timer.reset();
                  setSaved(`Sessão de ${formatDuration(input.durationMs)} salva a ${input.finalBpm} BPM.`);
                }}
              />
              <button type="button" onClick={discard} className="mt-2 h-11 w-full rounded-xl text-sm text-muted-foreground hover:text-destructive">Descartar sessão</button>
            </>
          ) : (
            <>
              <h2 id="timer-h" className="font-semibold">Sessão</h2>
              <p className="mt-2 text-center font-mono text-5xl font-bold" aria-live="off">{formatDuration(timer.elapsedMs)}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {timer.state === "running" ? (
                  <button type="button" className="col-span-2 h-14 rounded-xl bg-secondary font-semibold" onClick={timer.pause}>
                    <Pause className="mr-1 inline h-5 w-5" /> Pausar
                  </button>
                ) : (
                  <button type="button" className="col-span-2 h-14 rounded-xl bg-secondary font-semibold" onClick={timer.start}>
                    <Play className="mr-1 inline h-5 w-5" /> {timer.state === "paused" ? "Retomar" : "Iniciar"}
                  </button>
                )}
                <button type="button" aria-label="Zerar cronômetro" className="h-14 rounded-xl bg-secondary" onClick={() => { if (!draft || confirm("Zerar descarta o rascunho não salvo. Continuar?")) { timer.reset(); setDraft(null); setSaved(null); } }}>
                  <RotateCcw className="mx-auto h-5 w-5" />
                </button>
              </div>
              <button type="button" disabled={timer.state === "idle"} onClick={finish} className="mt-2 h-14 w-full rounded-xl border border-primary font-semibold text-primary disabled:opacity-40">
                <Flag className="mr-1 inline h-5 w-5" /> Finalizar sessão
              </button>
              {draft && (
                <div role="status" className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-status-learning/15 p-3 text-sm">
                  <span>Rascunho não salvo.</span>
                  <button type="button" className="font-semibold text-primary underline" onClick={() => setFormOpen(true)}>Abrir registro</button>
                </div>
              )}
              {saved && (
                <div role="status" className="mt-3 rounded-lg bg-muted p-3 text-sm">
                  {saved} <Link to="/progresso" className="text-primary underline">Ver progresso</Link>
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Mínimo de {MIN_DURATION_MS / 1000}s para salvar.</p>
            </>
          )}
        </section>

        <MetronomePanel {...metro} />
      </div>
    </div>
  );
}
