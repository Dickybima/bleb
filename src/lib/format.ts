const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});
const compactNum = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function fmtUsd(value?: string | number | null) {
  const n = Number(value);
  return Number.isFinite(n) ? compactUsd.format(n) : "–";
}

export function fmtNum(value?: string | number | null) {
  const n = Number(value);
  return Number.isFinite(n) ? compactNum.format(n) : "–";
}

/** The API reports `marketCapDelta24h` as an absolute USD change; convert it to a percentage. */
export function pctChange(marketCap?: string, delta?: string): number | null {
  const mc = Number(marketCap);
  const d = Number(delta);
  const prev = mc - d;
  if (!Number.isFinite(mc) || !Number.isFinite(d) || prev <= 0) return null;
  return (d / prev) * 100;
}

export function fmtPct(pct: number | null) {
  if (pct === null) return "–";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(Math.abs(pct) >= 100 ? 0 : 1)}%`;
}

export const shortAddr = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
