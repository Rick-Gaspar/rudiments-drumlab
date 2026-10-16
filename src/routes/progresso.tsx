import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { RUDIMENTS, getRudiment } from "@/data/rudiments";
import { deleteSession, statusOf, totalMs, useProgress, useSessions } from "@/lib/practice-store";
import { FamilyBadge, StatusDot } from "@/components/rudiment-badges";
import { formatDuration } from "@/lib/use-session-timer";

export const Route = createFileRoute("/progresso")({
  head: () => ({
    meta: [
      { title: "Progresso — Rudiment Lab" },
      { name: "description", content: "Seu tempo de prática, sessões e recordes de BPM em cada rudimento." },
      { property: "og:title", content: "Progresso — Rudiment Lab" },
      { property: "og:description", content: "Seu tempo de prática, sessões e recordes de BPM em cada rudimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Progress,
});

function Progress() {
  const sessions = useSessions();
  const progress = useProgress();
  const practiced = RUDIMENTS.filter((r) => totalMs(sessions, r.id) > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
      <h1 className="text-3xl font-bold md:text-5xl">Progresso</h1>
      <p className="mt-2 text-sm text-muted-foreground">Salvo apenas neste dispositivo e navegador.</p>

      <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          ["Tempo total", formatDuration(totalMs(sessions))],
          ["Sessões", String(sessions.length)],
          ["Rudimentos", `${practiced.length}/40`],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl border bg-card p-4">
            <dt className="text-xs text-muted-foreground">{l}</dt>
            <dd className="mt-1 font-mono text-2xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      {sessions.length === 0 ? (
        <div className="mt-8 rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Nenhuma sessão salva ainda. Abra um rudimento, toque em "Praticar agora" e use "Finalizar sessão" ao terminar.
        </div>
      ) : (
        <>
          <h2 className="mt-10 text-xl font-semibold">Por rudimento</h2>
          <ul className="mt-3 divide-y rounded-2xl border bg-card">
            {practiced.map((r) => (
              <li key={r.id}>
                <Link to="/rudimentos/$id" params={{ id: r.id }} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-accent">
                  <span className="flex items-center gap-2 font-medium">{r.name} <FamilyBadge family={r.family} /></span>
                  <span className="flex items-center gap-4 font-mono text-sm">
                    <StatusDot status={statusOf(progress, r.id)} />
                    {formatDuration(totalMs(sessions, r.id))}
                    <span className="text-muted-foreground">{progress[r.id]?.personalBestBpm ?? "—"} BPM</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-xl font-semibold">Sessões recentes</h2>
          <ul className="mt-3 divide-y rounded-2xl border bg-card text-sm">
            {sessions.slice(0, 30).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 p-3">
                <span>
                  <span className="block font-medium">{getRudiment(s.rudimentId)?.name ?? s.rudimentId}</span>
                  <span className="text-xs text-muted-foreground">{new Date(s.endedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                </span>
                <span className="flex items-center gap-3 font-mono">
                  {formatDuration(s.durationMs)} · {s.bpm} BPM
                  <button type="button" aria-label="Apagar sessão" className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive" onClick={() => confirm("Apagar esta sessão?") && deleteSession(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
