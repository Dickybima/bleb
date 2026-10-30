const compactNum = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function fmtNum(value?: string | number | null) {
  const n = Number(value);
  return Number.isFinite(n) ? compactNum.format(n) : "–";
}

export const shortAddr = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });

/** "5 menit yang lalu" style label for a unix timestamp in seconds. */
export function timeAgo(unixSeconds?: number) {
  if (!unixSeconds) return "";
  const diff = unixSeconds - Date.now() / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, secs] of steps) if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  return "baru saja";
}
