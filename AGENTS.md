<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Rudiment data lives only in src/data/rudiments.ts; unverified sticking/notation stays null with dataStatus "pending" (never invent).
- Practice sessions persist in IndexedDB behind the SessionRepository port in src/lib/sessions (pure metrics in model.ts); manual learning status stays in src/lib/practice-store.ts — keeps storage swappable for future cloud sync.
- Audio lives in src/lib/audio (AudioContext lookahead scheduling, one active metronome/demo at a time); UI components never schedule sound directly — keeps timing drift-free.
- Notation renders client-side via VexFlow (dynamic import) in src/components/notation-view.tsx from typed NotationData — never static images.
- PWA: vite-plugin-pwa (generateSW, /sw.js) configured in vite.config.ts; registration only via the guarded wrapper src/lib/pwa/register-sw.ts (never in dev/preview) — keeps previews free of stale-cache workers.
