import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";
import type { PracticeSession } from "@/lib/sessions/model";

// 2026-10-22T02:30:00Z crosses the day boundary depending on the time zone.
const ISO = "2026-10-22T02:30:00.000Z";

const session: PracticeSession = {
  id: "s1",
  rudimentId: "single-stroke-roll",
  startedAt: ISO,
  durationMs: 60000,
  startBpm: null,
  finalBpm: 60,
  cleanBpm: null,
  notes: "",
  rating: null,
  createdAt: ISO,
  updatedAt: ISO,
};

// Sessions come from IndexedDB in the real app; here the store is seeded directly.
vi.mock("@/lib/sessions/store", () => ({
  useSessionsState: () => ({ status: "ready", sessions: [session], error: null }),
  useSessions: () => [session],
  loadSessions: vi.fn(),
  importSessions: vi.fn(),
  createSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
}));

// VexFlow needs canvas/SVG APIs jsdom lacks; the date sections render without it.
vi.mock("@/components/notation-view", () => ({
  NotationView: () => <div data-testid="notation-stub" />,
}));

const original = process.env["TZ"];
afterEach(() => {
  process.env["TZ"] = original;
});

async function renderRoute(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient: new QueryClient() },
  });
  await router.load();
  render(<RouterProvider router={router} />);
}

describe.each([
  ["America/Sao_Paulo", "21/10/2026 às 23:30", "21/10/2026", "21/10"],
  ["UTC", "22/10/2026 às 02:30", "22/10/2026", "22/10"],
  ["Asia/Tokyo", "22/10/2026 às 11:30", "22/10/2026", "22/10"],
])("fuso %s", (tz, dateTime, date, dayMonth) => {
  it("Progresso mostra histórico e recentes em pt-BR no horário local", async () => {
    process.env["TZ"] = tz;
    await renderRoute("/progresso");

    // Histórico de sessões e "Praticados recentemente" usam data + hora.
    // (exact: false porque a data aparece junto do nome do rudimento nos recentes.)
    await waitFor(() =>
      expect(screen.getAllByText(dateTime, { exact: false }).length).toBeGreaterThanOrEqual(2),
    );
    // O gráfico "Minutos por dia" existe; os rótulos de eixo não renderizam no
    // jsdom (largura 0), então o formato dia/mês é coberto em format-date.test.ts.
    await waitFor(() => expect(screen.getByText("Minutos por dia")).toBeInTheDocument());
    expect(dayMonth).toMatch(/^\d{2}\/\d{2}$/);
  });

  it("página do rudimento mostra última prática e histórico em pt-BR no horário local", async () => {
    process.env["TZ"] = tz;
    await renderRoute("/rudimentos/single-stroke-roll");

    // "Última prática" usa só a data; o histórico lista data + hora da sessão.
    await waitFor(() => expect(screen.getByText(date)).toBeInTheDocument());
    expect(screen.getByText(dateTime)).toBeInTheDocument();
  });
});
