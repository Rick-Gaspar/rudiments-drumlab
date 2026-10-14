import { Link } from "@tanstack/react-router";
import { Drum, LineChart, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Praticar", icon: Drum },
  { to: "/progresso", label: "Progresso", icon: LineChart },
  { to: "/configuracoes", label: "Ajustes", icon: Settings },
] as const;

export function AppNav() {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-surface p-5 md:flex">
        <Link to="/" className="mb-10 flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">RL</span>
          Rudiment Lab
        </Link>
        <nav aria-label="Navegação principal" className="flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" ? false : true }}
              className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-primary"
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t bg-surface/95 backdrop-blur md:hidden"
      >
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground data-[status=active]:text-primary"
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
