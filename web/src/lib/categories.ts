import type { TransactionType } from "../db/db";

export const CATEGORIES: Record<TransactionType, string[]> = {
  income: ["Salary", "Freelance", "Gifts", "Refunds", "Other income"],
  expense: [
    "Groceries",
    "Rent",
    "Bills",
    "Transport",
    "Eating out",
    "Shopping",
    "Health",
    "Leisure",
    "Travel",
    "Other",
  ],
};

export const CURRENCIES = ["EUR", "USD", "GBP", "CHF"] as const;
