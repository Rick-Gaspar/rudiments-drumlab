import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Ajustes — Rudiment Lab" },
      { name: "description", content: "Preferências do Rudiment Lab (em breve)." },
      { property: "og:title", content: "Ajustes — Rudiment Lab" },
      { property: "og:description", content: "Preferências do Rudiment Lab (em breve)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ComingSoon
      icon={Settings}
      title="Ajustes"
      text="Preferências de metrônomo, som e exibição serão adicionadas junto com as ferramentas de prática."
    />
  ),
});
