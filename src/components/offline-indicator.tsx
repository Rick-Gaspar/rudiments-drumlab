import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** Fixed banner shown while the browser reports no connectivity. */
export function OfflineIndicator() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500/95 px-4 py-1.5 text-center text-xs font-medium text-amber-950"
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden />
      Você está offline. O app continua funcionando, mas links externos podem não abrir.
    </div>
  );
}
