import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "rudiment-lab:install-dismissed:v1";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const touchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || touchMac;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

/**
 * Contextual install hint. Android/desktop Chrome: uses beforeinstallprompt
 * when the browser fires it. iOS: shows share-sheet instructions (iOS has no
 * programmatic install prompt). Shown at most once until dismissed.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      return;
    }
    if (isIos()) {
      setIos(true);
      setVisible(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch {
      /* storage indisponível: apenas fecha */
    }
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") dismiss();
    setDeferred(null);
  };

  return (
    <div
      role="dialog"
      aria-label="Instalar aplicativo"
      className="fixed inset-x-4 bottom-20 z-40 rounded-lg border border-border bg-card p-4 shadow-lg md:inset-x-auto md:bottom-6 md:right-6 md:w-80"
    >
      <button
        onClick={dismiss}
        aria-label="Fechar"
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
      <p className="pr-6 text-sm font-semibold text-foreground">Instalar o Rudiment Lab</p>
      {ios ? (
        <p className="mt-1 text-xs text-muted-foreground">
          No Safari, toque em <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden />{" "}
          Compartilhar e depois em “Adicionar à Tela de Início”.
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          Instale para abrir em tela cheia e praticar mesmo sem internet.
        </p>
      )}
      {!ios && deferred && (
        <button
          onClick={install}
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Instalar
        </button>
      )}
    </div>
  );
}
