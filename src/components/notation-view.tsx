import { useEffect, useRef, useState } from "react";
import type { NotationData } from "@/data/rudiments";
import { cn } from "@/lib/utils";

/** Renders verified notation with VexFlow (loaded client-side only). */
export function NotationView({ notation, className }: { notation: NotationData; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const VF = await import("vexflow");
        const el = ref.current;
        if (!el || cancelled) return;
        el.innerHTML = "";
        const [num = 4, den = 4] = notation.timeSignature.split("/").map(Number);
        const evs = notation.events;
        const width = Math.max(320, evs.length * 46 + 130);
        const renderer = new VF.Renderer(el, VF.Renderer.Backends.SVG);
        renderer.resize(width, 170);
        const ctx = renderer.getContext();
        const stave = new VF.Stave(10, 20, width - 20);
        stave.addClef("percussion").addTimeSignature(notation.timeSignature);
        stave.setContext(ctx).draw();

        const notes = evs.map((e) => {
          const n = new VF.StaveNote({ keys: ["c/5"], duration: e.duration, stem_direction: 1 });
          if (e.accent) n.addModifier(new VF.Articulation("a>").setPosition(VF.Modifier.Position.ABOVE), 0);
          if (e.flamGrace) {
            const g = new VF.GraceNote({ keys: ["c/5"], duration: "8", slash: true, stem_direction: 1 });
            n.addModifier(new VF.GraceNoteGroup([g], false), 0);
          }
          const label = (e.flamGrace ? e.flamGrace.toLowerCase() : "") + e.hand;
          n.addModifier(
            new VF.Annotation(label).setFont("JetBrains Mono, monospace", 13, "bold").setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM),
            0,
          );
          return n;
        });
        const beams: InstanceType<typeof VF.Beam>[] = [];
        for (let i = 0; i < notes.length; i += notation.beamGroup) {
          beams.push(new VF.Beam(notes.slice(i, i + notation.beamGroup)));
        }
        const voice = new VF.Voice({ num_beats: num * notation.measures, beat_value: den }).setStrict(false);
        voice.addTickables(notes);
        new VF.Formatter().joinVoices([voice]).format([voice], width - 110);
        voice.draw(ctx, stave);
        beams.forEach((b) => b.setContext(ctx).draw());
        const svg = el.querySelector("svg");
        svg?.setAttribute("role", "img");
        svg?.setAttribute("aria-label", "Partitura do rudimento");
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [notation]);

  return (
    <div className={cn("overflow-x-auto rounded-xl bg-foreground p-2 text-background", className)}>
      {error ? (
        <p className="p-4 text-sm">Não foi possível desenhar a partitura neste navegador.</p>
      ) : (
        <div ref={ref} className="min-h-[170px] [&_svg]:mx-auto" />
      )}
    </div>
  );
}
