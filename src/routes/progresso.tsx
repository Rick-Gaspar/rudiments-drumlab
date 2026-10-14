import { createFileRoute } from "@tanstack/react-router";
import { LineChart } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/progresso")({
  head: () => ({
    meta: [
      { title: "Progresso — Rudiment Lab" },
      { name: "description", content: "Acompanhamento de progresso nos rudimentos de bateria (em breve)." },
      { property: "og:title", content: "Progresso — Rudiment Lab" },
      { property: "og:description", content: "Acompanhamento de progresso nos rudimentos de bateria (em breve)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ComingSoon
      icon={LineChart}
      title="Progresso"
      text="O histórico de sessões, recordes de BPM e estatísticas de prática chegam em uma próxima fase. Nenhum dado foi registrado ainda."
    />
  ),
});
