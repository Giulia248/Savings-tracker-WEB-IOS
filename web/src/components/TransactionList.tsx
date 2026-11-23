import { db, type Transaction } from "../db/db";
import { formatDay, formatMoney } from "../lib/format";

export function TransactionList({ transactions, currency }: { transactions: Transaction[]; currency: string }) {
  return (
    <ul className="transactions">
      {transactions.map((t) => {
        const amount = formatMoney(t.amountCents, currency);
        const isIncome = t.type === "income";
        return (
          <li key={t.id} className="transactions__row">
            <span className="transactions__date muted">{formatDay(t.date)}</span>
            <span className="transactions__what">
              <span className="transactions__category">{t.category}</span>
              {t.note && <span className="transactions__note muted">{t.note}</span>}
            </span>
            <span className={`transactions__amount ${isIncome ? "income" : "spending"}`}>
              {isIncome ? "+" : "−"}
              {amount}
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label={`Delete ${t.category}, ${amount}, ${formatDay(t.date)}`}
              onClick={() => db.transactions.delete(t.id)}
            >
              ×
            </button>
          </li>
        );
      })}
    </ul>
  );
}
