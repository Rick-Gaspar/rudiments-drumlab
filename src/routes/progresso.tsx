import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatDateTime, formatDayMonth } from "@/lib/format-date";
import { RUDIMENTS, getRudiment } from "@/data/rudiments";
import { statusOf, useProgress } from "@/lib/practice-store";
import { FamilyBadge, StatusDot } from "@/components/rudiment-badges";
import { formatDuration } from "@/lib/use-session-timer";
import { useSessionsState, importSessions, loadSessions } from "@/lib/sessions/store";
import {
  dailySeries, filterSessions, parseBackup, planImport, rudimentStats, streakDays, toBackup, toCsv, totalMs, type PracticeSession,
} from "@/lib/sessions/model";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { SessionRowActions } from "@/components/sessions/session-row-actions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/progresso")({
  head: () => ({
    meta: [
      { title: "Progresso — Rudiment Lab" },
      { name: "description", content: "Seu tempo de prática, sessões e recordes de BPM limpo em cada rudimento." },
      { property: "og:title", content: "Progresso — Rudiment Lab" },
      { property: "og:description", content: "Seu tempo de prática, sessões e recordes de BPM limpo em cada rudimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Progress,
});

const chartConfig = { minutes: { label: "Minutos", color: "var(--primary)" } } satisfies ChartConfig;
const fmtDate = formatDateTime;
const nameOf = (id: string) => getRudiment(id)?.name ?? id;
const validIds = new Set(RUDIMENTS.map((r) => r.id));

function download(name: string, type: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

function Progress() {
  const st = useSessionsState();
  const progress = useProgress();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rid, setRid] = useState("");
  const [pending, setPending] = useState<ReturnType<typeof planImport> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const all = st.sessions;
  const list = useMemo(() => filterSessions(all, { from: from || undefined, to: to || undefined, rudimentId: rid || undefined }), [all, from, to, rid]);
  const practiced = RUDIMENTS.filter((r) => list.some((s) => s.rudimentId === r.id));
  const recent = useMemo(() => RUDIMENTS.map((r) => ({ r, s: rudimentStats(all, r.id) })).filter((x) => x.s.count).sort((a, b) => (a.s.lastPracticedAt! < b.s.lastPracticedAt! ? 1 : -1)).slice(0, 5), [all]);
  const series = useMemo(() => dailySeries(list), [list]);
  const stamp = new Date().toISOString().slice(0, 10);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const r = parseBackup(await f.text(), validIds);
    if (fileRef.current) fileRef.current.value = "";
    if (!r.ok) { toast.error(r.error); return; }
    setPending(planImport(all, r.sessions));
  };
  const doImport = async () => {
    if (!pending) return;
    try {
      await importSessions(pending.toAdd);
      toast.success(`${pending.toAdd.length} sessão(ões) importada(s).`);
    } catch (e) {
      toast.error(`Falha na importação: ${e instanceof Error ? e.message : "erro"}`);
    }
    setPending(null);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
      <h1 className="text-3xl font-bold md:text-5xl">Progresso</h1>
      <p className="mt-2 text-sm text-muted-foreground">Salvo apenas neste dispositivo e navegador.</p>

      {st.status === "loading" && <p className="mt-8 text-sm text-muted-foreground" role="status">Carregando sessões…</p>}
      {st.status === "error" && (
        <div role="alert" className="mt-8 rounded-2xl border border-destructive bg-card p-6 text-sm">
          Não foi possível ler suas sessões: {st.error}{" "}
          <button type="button" className="text-primary underline" onClick={() => void loadSessions()}>Tentar de novo</button>
        </div>
      )}

      {st.status === "ready" && (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" disabled={!all.length} onClick={() => download(`rudiment-lab-sessoes-${stamp}.csv`, "text/csv;charset=utf-8", "\uFEFF" + toCsv(all, nameOf))} className="inline-flex h-11 items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-medium disabled:opacity-40">
              <Download className="h-4 w-4" /> Exportar CSV
            </button>
            <button type="button" disabled={!all.length} onClick={() => download(`rudiment-lab-backup-${stamp}.json`, "application/json", JSON.stringify(toBackup(all), null, 2))} className="inline-flex h-11 items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-medium disabled:opacity-40">
              <Download className="h-4 w-4" /> Exportar JSON
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-medium">
              <Upload className="h-4 w-4" /> Importar backup JSON
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
          </div>

          {all.length === 0 ? (
            <div className="mt-8 rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
              Nenhuma sessão salva ainda. Abra um rudimento, toque em "Praticar agora" e use "Finalizar sessão" ao terminar.
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3">
                <label className="text-sm"><span className="text-muted-foreground">De</span>
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-11 w-full rounded-lg border bg-background px-3" /></label>
                <label className="text-sm"><span className="text-muted-foreground">Até</span>
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-11 w-full rounded-lg border bg-background px-3" /></label>
                <label className="text-sm"><span className="text-muted-foreground">Rudimento</span>
                  <select value={rid} onChange={(e) => setRid(e.target.value)} className="mt-1 h-11 w-full rounded-lg border bg-background px-3">
                    <option value="">Todos</option>
                    {RUDIMENTS.map((r) => <option key={r.id} value={r.id}>{r.order}. {r.name}</option>)}
                  </select></label>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                {[
                  ["Tempo total", formatDuration(totalMs(list))],
                  ["Sessões", String(list.length)],
                  ["Rudimentos", `${practiced.length}/40`],
                  ["Sequência", `${streakDays(all)} dia(s)`],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-2xl border bg-card p-4">
                    <dt className="text-xs text-muted-foreground">{l}</dt>
                    <dd className="mt-1 font-mono text-2xl font-bold">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">Os três primeiros números seguem os filtros. Sequência = dias seguidos com pelo menos uma sessão, terminando hoje ou ontem.</p>

              {list.length === 0 ? (
                <p className="mt-8 rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Nenhuma sessão corresponde aos filtros.</p>
              ) : (
                <>
                  <h2 className="mt-10 text-xl font-semibold">Minutos por dia</h2>
                  <ChartContainer config={chartConfig} className="mt-3 h-56 w-full rounded-2xl border bg-card p-3">
                    <BarChart data={series.map((d) => ({ ...d, label: formatDayMonth(d.day) }))}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis width={32} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="minutes" fill="var(--color-minutes)" radius={4} />
                    </BarChart>
                  </ChartContainer>

                  <h2 className="mt-10 text-xl font-semibold">Por rudimento</h2>
                  <ul className="mt-3 divide-y rounded-2xl border bg-card">
                    {practiced.map((r) => {
                      const s = rudimentStats(list, r.id);
                      const best = rudimentStats(all, r.id).bestCleanBpm;
                      return (
                        <li key={r.id}>
                          <Link to="/rudimentos/$id" params={{ id: r.id }} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-accent">
                            <span className="flex items-center gap-2 font-medium">{r.name} <FamilyBadge family={r.family} /></span>
                            <span className="flex items-center gap-4 font-mono text-sm">
                              <StatusDot status={statusOf(progress, r.id, s.count)} />
                              {formatDuration(s.totalMs)}
                              <span className="text-muted-foreground" title="Recorde de BPM limpo (informado por você)">{best ?? "—"} BPM limpo</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  <h2 className="mt-10 text-xl font-semibold">Praticados recentemente</h2>
                  <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                    {recent.map(({ r, s }) => (
                      <li key={r.id}><Link to="/rudimentos/$id" params={{ id: r.id }} className="inline-block rounded-lg border bg-card px-3 py-2 hover:bg-accent">{r.name} · {fmtDate(s.lastPracticedAt!)}</Link></li>
                    ))}
                  </ul>

                  <h2 className="mt-10 text-xl font-semibold">Histórico de sessões</h2>
                  <ul className="mt-3 divide-y rounded-2xl border bg-card text-sm">
                    {list.map((s) => <SessionRow key={s.id} s={s} />)}
                  </ul>
                </>
              )}
            </>
          )}
        </>
      )}

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar backup?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.toAdd.length ?? 0} sessão(ões) nova(s) serão adicionadas. {pending?.duplicates ?? 0} já existem e serão ignoradas.
              {pending?.conflicts ? ` ${pending.conflicts} têm o mesmo identificador de uma sessão sua com dados diferentes e NÃO serão sobrescritas.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={!pending?.toAdd.length} onClick={doImport}>Importar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SessionRow({ s }: { s: PracticeSession }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 p-3">
      <span className="min-w-0">
        <span className="block font-medium">{nameOf(s.rudimentId)}</span>
        <span className="text-xs text-muted-foreground">{fmtDate(s.startedAt)}{s.notes && ` · ${s.notes}`}</span>
      </span>
      <span className="flex items-center gap-3 font-mono text-xs sm:text-sm">
        {formatDuration(s.durationMs)} · {s.startBpm ? `${s.startBpm}→` : ""}{s.finalBpm} BPM{s.cleanBpm ? ` · limpo ${s.cleanBpm}` : ""}
        <SessionRowActions session={s} />
      </span>
    </li>
  );
}
