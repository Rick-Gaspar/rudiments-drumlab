import { afterEach, describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatDayMonth } from "@/lib/format-date";

const original = process.env.TZ;
afterEach(() => {
  process.env.TZ = original;
});

// 2026-10-22T02:30:00Z crosses the day boundary depending on the time zone.
const ISO = "2026-10-22T02:30:00.000Z";

describe.each([
  ["America/Sao_Paulo", "21/10/2026 às 23:30", "21/10/2026", "21/10"],
  ["UTC", "22/10/2026 às 02:30", "22/10/2026", "22/10"],
  ["Europe/Lisbon", "22/10/2026 às 03:30", "22/10/2026", "22/10"],
  ["Asia/Tokyo", "22/10/2026 às 11:30", "22/10/2026", "22/10"],
  ["America/Los_Angeles", "21/10/2026 às 19:30", "21/10/2026", "21/10"],
])("fuso %s", (tz, dateTime, date, dayMonth) => {
  it("formata data e hora em pt-BR no horário local", () => {
    process.env.TZ = tz;
    expect(formatDateTime(ISO)).toBe(dateTime);
    expect(formatDate(ISO)).toBe(date);
    expect(formatDayMonth(ISO)).toBe(dayMonth);
  });

  it("mantém o dia de uma chave YYYY-MM-DD sem deslocar", () => {
    process.env.TZ = tz;
    expect(formatDate("2026-01-05")).toBe("05/01/2026");
    expect(formatDayMonth("2026-01-05")).toBe("05/01");
  });
});
