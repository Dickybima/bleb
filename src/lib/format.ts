const compactNum = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function fmtNum(value?: string | number | null) {
  const n = Number(value);
  return Number.isFinite(n) ? compactNum.format(n) : "–";
}

export const shortAddr = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
