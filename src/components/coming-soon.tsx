import type { LucideIcon } from "lucide-react";

export function ComingSoon({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
      <h1 className="text-3xl font-bold md:text-5xl">{title}</h1>
      <div className="mt-8 rounded-2xl border border-dashed bg-card p-10 text-center">
        <Icon className="mx-auto h-10 w-10 text-primary" aria-hidden />
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-primary">Em breve</p>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
