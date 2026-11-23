import { db, type Profile, type Transaction } from "../db/db";
import { todayISO } from "./format";

/** The JSON format shared with the iOS app. */
export interface Backup {
  app: "savings-tracker";
  version: 1;
  exportedAt: string;
  profile: { displayName: string; currency: string };
  transactions: Array<Pick<Transaction, "type" | "amountCents" | "category" | "date" | "note">>;
}

export async function exportBackup(profile: Profile): Promise<void> {
  const transactions = await db.transactions.where("profileId").equals(profile.id).toArray();
  const backup: Backup = {
    app: "savings-tracker",
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: { displayName: profile.displayName, currency: profile.currency },
    transactions: transactions.map(({ type, amountCents, category, date, note }) => ({
      type,
      amountCents,
      category,
      date,
      note,
    })),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `savings-tracker-${profile.nameKey.replace(/\W+/g, "-")}-${todayISO()}.json`;
  link.click();
  // Some browsers start the download asynchronously, so the URL is revoked later.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isBackup(value: unknown): value is Backup {
  if (typeof value !== "object" || value === null) return false;
  const backup = value as Partial<Backup>;
  return (
    backup.app === "savings-tracker" &&
    backup.version === 1 &&
    Array.isArray(backup.transactions) &&
    backup.transactions.every(
      (t) =>
        (t.type === "income" || t.type === "expense") &&
        Number.isInteger(t.amountCents) &&
        t.amountCents > 0 &&
        typeof t.category === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
        typeof t.note === "string",
    )
  );
}

/** Reads and validates an export file without changing the database. */
export async function readBackup(file: File): Promise<Backup> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!isBackup(parsed)) throw new Error("This file is not a Savings tracker export.");
  return parsed;
}

type BackupTransaction = Backup["transactions"][number];

function duplicateKey(t: BackupTransaction): string {
  return [t.date, t.type, t.amountCents, t.category, t.note].join("|");
}

export interface ImportResult {
  added: number;
  skipped: number;
}

/** Adds transactions, skipping duplicates. Copies are counted, so real repeats survive. */
export async function importBackup(profileId: number, backup: Backup): Promise<ImportResult> {
  return db.transaction("rw", db.transactions, async () => {
    const existing = new Map<string, number>();
    await db.transactions
      .where("profileId")
      .equals(profileId)
      .each((t) => {
        const key = duplicateKey(t);
        existing.set(key, (existing.get(key) ?? 0) + 1);
      });

    const toAdd: BackupTransaction[] = [];
    for (const t of backup.transactions) {
      const key = duplicateKey(t);
      const remaining = existing.get(key) ?? 0;
      if (remaining > 0) existing.set(key, remaining - 1);
      else toAdd.push(t);
    }

    const now = Date.now();
    await db.transactions.bulkAdd(toAdd.map((t) => ({ ...t, profileId, createdAt: now })));
    return { added: toAdd.length, skipped: backup.transactions.length - toAdd.length };
  });
}
