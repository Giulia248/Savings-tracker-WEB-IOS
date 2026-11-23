import type { Transaction } from "../db/db";
import { lastMonthKeys, monthName } from "./format";

export interface MonthTotals {
  incomeCents: number;
  spendingCents: number;
  savedCents: number;
}

export interface MonthPoint extends MonthTotals {
  month: string;
  label: string;
}

export interface CategoryPoint {
  category: string;
  amountCents: number;
}

export function totalsFor(transactions: Transaction[], monthKey: string): MonthTotals {
  let incomeCents = 0;
  let spendingCents = 0;
  for (const t of transactions) {
    if (!t.date.startsWith(monthKey)) continue;
    if (t.type === "income") incomeCents += t.amountCents;
    else spendingCents += t.amountCents;
  }
  return { incomeCents, spendingCents, savedCents: incomeCents - spendingCents };
}

export function monthlyCashflow(transactions: Transaction[], months = 6): MonthPoint[] {
  return lastMonthKeys(months).map((month) => ({
    month,
    label: monthName(month, "short"),
    ...totalsFor(transactions, month),
  }));
}

/** Spending per category for one month, largest first. */
export function spendingByCategory(transactions: Transaction[], monthKey: string): CategoryPoint[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense" || !t.date.startsWith(monthKey)) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amountCents);
  }
  return [...totals]
    .map(([category, amountCents]) => ({ category, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents);
}
