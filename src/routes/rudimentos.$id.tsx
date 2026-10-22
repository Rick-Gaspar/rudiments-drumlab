import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { ArrowLeft, ExternalLink, Clock, Play } from "lucide-react";
import { NotationView } from "@/components/notation-view";
import { getRudiment, FAMILY_LABELS } from "@/data/rudiments";
import { useProgress, statusOf, setStatus, STATUS_LABELS, type LearningStatus } from "@/lib/practice-store";
import { useSessions } from "@/lib/sessions/store";
import { rudimentStats } from "@/lib/sessions/model";
import { FamilyBadge } from "@/components/rudiment-badges";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/use-session-timer";

export const Route = createFileRoute("/rudimentos/$id")({
  loader: ({ params }) => {
    const rudiment = getRudiment(params.id);
    if (!rudiment) throw notFound();
    return { rudiment };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.rudiment.name} — Rudiment Lab` : "Rudimento não encontrado — Rudiment Lab";
    const desc = loaderData
      ? `Rudimento PAS #${loaderData.rudiment.order} (${FAMILY_LABELS[loaderData.rudiment.family]}): referência oficial e recursos de estudo.`
      : "Rudimento não encontrado.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Rudimento não encontrado</h1>
      <Link to="/" className="mt-4 inline-block text-primary underline">Voltar à biblioteca</Link>
    </div>
  ),
  component: Detail,
});

const statuses: LearningStatus[] = ["not_started", "learning", "practiced"];

function Detail() {
  const { rudiment: r } = Route.useLoaderData();
  const progress = useProgress();
  const all = useSessions();
  const sessions = all.filter((s) => s.rudimentId === r.id);
  const st = rudimentStats(all, r.id);
  const current = statusOf(progress, r.id, st.count);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
      <Link to="/" className="inline-flex h-10 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Biblioteca
      </Link>

      <header className="stick-grid mt-4 rounded-2xl border bg-card p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-primary">#{String(r.order).padStart(2, "0")} / 40</span>
          <FamilyBadge family={r.family} />
        </div>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">{r.name}</h1>
      </header>

      <section aria-labelledby="status-h" className="mt-6 rounded-2xl border bg-card p-6">
        <h2 id="status-h" className="font-semibold">Status de aprendizado</h2>
        <div role="radiogroup" aria-labelledby="status-h" className="mt-4 grid grid-cols-3 gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={current === s}
              onClick={() => setStatus(r.id, s)}
              className={cn(
                "h-12 rounded-lg border px-2 text-sm font-medium transition-colors",
                current === s ? "border-primary bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Salvo apenas neste dispositivo. Com sessões salvas, o status é pelo menos "Aprendendo".</p>
      </section>

      <section aria-labelledby="hist-h" className="mt-6 rounded-2xl border bg-card p-6">
        <h2 id="hist-h" className="font-semibold">Seu histórico</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <Stat label="Tempo total" value={formatDuration(st.totalMs)} />
          <Stat label="Sessões" value={String(st.count)} />
          <Stat label="Recorde BPM limpo" value={st.bestCleanBpm ? String(st.bestCleanBpm) : "—"} />
          <Stat label="Última prática" value={st.lastPracticedAt ? formatDate(st.lastPracticedAt) : "—"} />
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">BPM limpo é informado por você ao salvar a sessão.</p>
        {sessions.length > 0 && (
          <ul className="mt-4 divide-y text-sm">
            {sessions.slice(0, 5).map((s) => (
              <li key={s.id} className="flex justify-between py-2">
                <span className="text-muted-foreground">{formatDateTime(s.startedAt)}</span>
                <span className="font-mono">{formatDuration(s.durationMs)} · {s.finalBpm} BPM</span>
              </li>
            ))}
          </ul>
        )}
      </section>


      <section aria-labelledby="data-h" className="mt-6 rounded-2xl border bg-card p-6">
        <h2 id="data-h" className="font-semibold">Manulação e notação</h2>
        {r.notation ? (
          <>
            <NotationView notation={r.notation} className="mt-4" />
            <p className="mt-3 font-mono text-sm">{r.sticking}</p>
            <Link
              to="/rudimentos/$id/praticar"
              params={{ id: r.id }}
              className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground"
            >
              <Play className="h-5 w-5" /> Praticar agora
            </Link>
          </>
        ) : (
          <div className="mt-3 flex items-start gap-3 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-status-learning" aria-hidden />
            <p>
              Pendente de validação. A manulação e a partitura serão adicionadas após verificação com a fonte oficial.
              A prática guiada fica desativada até lá.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="links-h" className="mt-6 grid gap-3 sm:grid-cols-2">
        <h2 id="links-h" className="sr-only">Links externos</h2>
        <ExtLink href={r.referenceUrl} title="Referência oficial PAS" sub="Vic Firth · 40 Essential Rudiments" />
        <ExtLink href={r.learningResourceUrl} title="Recurso de estudo" sub={`drumrudiments.com · ${r.name}`} />
      </section>
    </div>
  );
}

function ExtLink({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/60 hover:bg-accent"
    >
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{sub}</span>
      </span>
      <ExternalLink className="h-4 w-4 text-primary" aria-label="(abre em nova aba)" />
    </a>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-xl font-bold">{value}</dd>
    </div>
  );
}
