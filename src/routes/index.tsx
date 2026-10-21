import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { RUDIMENTS, FAMILY_LABELS, type RudimentFamily } from "@/data/rudiments";
import { useProgress, statusOf } from "@/lib/practice-store";
import { useSessions } from "@/lib/sessions/store";
import { FamilyBadge, StatusDot } from "@/components/rudiment-badges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Praticar — Rudiment Lab" },
      { name: "description", content: "Biblioteca completa dos 40 rudimentos essenciais PAS para estudo de bateria." },
      { property: "og:title", content: "Praticar — Rudiment Lab" },
      { property: "og:description", content: "Biblioteca completa dos 40 rudimentos essenciais PAS para estudo de bateria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Library,
});

type FamilyFilter = RudimentFamily | "all";
type SortKey = "order" | "name";
const families: FamilyFilter[] = ["all", "rolls", "diddles", "flams", "drags"];

function Library() {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<FamilyFilter>("all");
  const [sort, setSort] = useState<SortKey>("order");
  const progress = useProgress();
  const sessions = useSessions();
  const countOf = (id: string) => sessions.filter((s) => s.rudimentId === id).length;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const r = RUDIMENTS.filter(
      (x) => (family === "all" || x.family === family) && (!q || x.name.toLowerCase().includes(q)),
    );
    return [...r].sort((a, b) => (sort === "order" ? a.order - b.order : a.name.localeCompare(b.name, "en")));
  }, [query, family, sort]);

  const practiced = RUDIMENTS.filter((r) => statusOf(progress, r.id, countOf(r.id)) === "practiced").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <header className="stick-grid mb-8 rounded-2xl border bg-card p-6 md:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">PAS · 40 Essential Rudiments</p>
        <h1 className="mt-2 text-3xl font-bold md:text-5xl">Biblioteca de rudimentos</h1>
        <p className="mt-3 text-muted-foreground">
          <span className="font-mono text-foreground">{RUDIMENTS.length}</span> rudimentos ·{" "}
          <span className="font-mono text-foreground">{practiced}</span> marcados como praticados
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <label htmlFor="search" className="sr-only">Buscar rudimento</label>
            <Input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome…"
              className="h-12 pl-10"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-12 sm:w-52" aria-label="Ordenar">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order">Ordem oficial</SelectItem>
              <SelectItem value="name">Nome (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div role="group" aria-label="Filtrar por família" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {families.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={family === f}
              onClick={() => setFamily(f)}
              className={cn(
                "h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                family === f ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "Todos" : FAMILY_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="font-display text-lg font-semibold">Nenhum rudimento encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">Tente outro termo de busca ou remova o filtro de família.</p>
          <Button variant="secondary" className="mt-4" onClick={() => { setQuery(""); setFamily("all"); }}>
            <X className="h-4 w-4" /> Limpar filtros
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <li key={r.id}>
              <Link
                to="/rudimentos/$id"
                params={{ id: r.id }}
                className="group flex h-full items-start gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/60 hover:bg-accent"
              >
                <span className="font-mono text-2xl font-bold text-muted-foreground transition-colors group-hover:text-primary">
                  {String(r.order).padStart(2, "0")}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="font-display font-semibold leading-tight">{r.name}</span>
                  <span className="flex flex-wrap items-center gap-3">
                    <FamilyBadge family={r.family} />
                    <StatusDot status={statusOf(progress, r.id, countOf(r.id))} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
