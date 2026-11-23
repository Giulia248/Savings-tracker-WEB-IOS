/** The interface copy is English, so dates and numbers use one fixed locale. */
export const LOCALE = "en-GB";

export function formatMoney(cents: number, currency: string, wholeUnits = false): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: wholeUnits ? 0 : 2,
    maximumFractionDigits: wholeUnits ? 0 : 2,
  }).format(cents / 100);
}

export function formatCompactMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

/** Parses "12.50" or "12,50" to cents. Null if not positive. */
export function parseAmount(input: string): number | null {
  const value = Number(input.trim().replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: value < 10 ? 4 : 2 }).format(value);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function currentMonthKey(): string {
  return todayISO().slice(0, 7);
}

/** The last `count` months as YYYY-MM, oldest first, ending with the current month. */
export function lastMonthKeys(count: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  }
  return keys;
}

export function monthName(monthKey: string, style: "short" | "long" = "long"): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(LOCALE, { month: style });
}

export function formatDay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(LOCALE, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
