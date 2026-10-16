import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Flag, Pause, Play, RotateCcw } from "lucide-react";
import { getRudiment } from "@/data/rudiments";
import { FamilyBadge } from "@/components/rudiment-badges";
import { NotationView } from "@/components/notation-view";
import { MetronomePanel, useMetronome } from "@/components/practice/metronome-panel";
import { DemoPanel, useDemo } from "@/components/practice/demo-panel";
import { formatDuration, useSessionTimer } from "@/lib/use-session-timer";
import { cn } from "@/lib/utils";
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
  const [finished, setFinished] = useState<{ rudimentId: string; durationMs: number } | null>(null);

  // Space toggles the metronome (when not typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.code !== "Space" || ["INPUT", "TEXTAREA", "BUTTON"].includes(t.tagName) || t.getAttribute("role")) return;
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
    setFinished({ rudimentId: r.id, durationMs });
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
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
                  e.hand === "R" ? "text-family-rolls" : "text-family-drags",
                  e.accent && "border-primary",
                  demo.snap.index === i && "bg-primary text-primary-foreground",
                )}
              >
                {e.flamGrace && <sup className="mr-0.5 text-[10px] font-normal">{e.flamGrace.toLowerCase()}</sup>}
                {e.hand}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Acentos (&gt;) em destaque · letra pequena = nota de flam · Fonte: {notation.source}
          </p>
        </section>
        <DemoPanel {...demo} />
      </div>

      <div className="min-w-0 space-y-6">
        <section aria-labelledby="timer-h" className="rounded-2xl border bg-card p-5">
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
            <button type="button" aria-label="Zerar cronômetro" className="h-14 rounded-xl bg-secondary" onClick={() => { timer.reset(); setFinished(null); }}>
              <RotateCcw className="mx-auto h-5 w-5" />
            </button>
          </div>
          <button type="button" disabled={timer.state === "idle"} onClick={finish} className="mt-2 h-14 w-full rounded-xl border border-primary font-semibold text-primary disabled:opacity-40">
            <Flag className="mr-1 inline h-5 w-5" /> Finalizar sessão
          </button>
          {finished && (
            <div role="status" className="mt-3 rounded-lg bg-muted p-3 text-sm">
              Sessão de <strong>{formatDuration(finished.durationMs)}</strong> pronta para registro.
              <span className="block text-xs text-muted-foreground">O salvamento do progresso chega na próxima fase — nada foi salvo ainda.</span>
            </div>
          )}
        </section>
        <MetronomePanel {...metro} />
      </div>
    </div>
  );
}
