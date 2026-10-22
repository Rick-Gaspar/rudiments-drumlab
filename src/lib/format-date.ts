/** Consistent pt-BR date display used across Progress, history and session screens. */
const pad = (n: number) => String(n).padStart(2, "0");
const toDate = (d: Date | string) => (typeof d === "string" ? new Date(d.length === 10 ? d + "T12:00" : d) : d);

/** 22/10/2026 */
export function formatDate(d: Date | string) {
  const x = toDate(d);
  return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`;
}

/** 22/10/2026 às 13:55 */
export function formatDateTime(d: Date | string) {
  const x = toDate(d);
  return `${formatDate(x)} às ${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

/** 22/10 (chart axis) */
export function formatDayMonth(d: Date | string) {
  const x = toDate(d);
  return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}`;
}
