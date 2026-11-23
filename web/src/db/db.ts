import Dexie, { type EntityTable } from "dexie";

export type TransactionType = "income" | "expense";

export interface Profile {
  id: number;
  /** Lowercased name, used to recognise the profile at login. */
  nameKey: string;
  displayName: string;
  currency: string;
  /** Resized image as a data URL. */
  avatar?: string;
  createdAt: number;
}

export interface Transaction {
  id: number;
  profileId: number;
  type: TransactionType;
  /** Always positive. The type decides the sign. */
  amountCents: number;
  category: string;
  /** Local date as YYYY-MM-DD. */
  date: string;
  note: string;
  createdAt: number;
}

export const db = new Dexie("savings-tracker") as Dexie & {
  profiles: EntityTable<Profile, "id">;
  transactions: EntityTable<Transaction, "id">;
};

db.version(1).stores({
  profiles: "++id, &nameKey",
  transactions: "++id, profileId, [profileId+date]",
});

export function toNameKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Newest first. */
export function listTransactions(profileId: number): Promise<Transaction[]> {
  return db.transactions
    .where("[profileId+date]")
    .between([profileId, Dexie.minKey], [profileId, Dexie.maxKey])
    .reverse()
    .toArray();
}

export function deleteAllTransactions(profileId: number): Promise<number> {
  return db.transactions.where("profileId").equals(profileId).delete();
}

export async function deleteProfile(profileId: number): Promise<void> {
  await db.transaction("rw", db.profiles, db.transactions, async () => {
    await deleteAllTransactions(profileId);
    await db.profiles.delete(profileId);
  });
}
