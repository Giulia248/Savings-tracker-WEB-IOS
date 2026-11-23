import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router";
import { CashflowChart } from "../components/CashflowChart";
import { CategoryChart } from "../components/CategoryChart";
import { TransactionList } from "../components/TransactionList";
import { listTransactions } from "../db/db";
import { currentMonthKey, formatMoney, monthName } from "../lib/format";
import { monthlyCashflow, spendingByCategory, totalsFor } from "../lib/summary";
import { useProfile } from "../session/session";

export function DashboardPage() {
  const profile = useProfile();
  const transactions = useLiveQuery(() => listTransactions(profile.id), [profile.id]);

  if (!transactions) return null;

  if (transactions.length === 0) {
    return (
      <div className="dashboard">
        <header className="dashboard__header">
          <h1>Nothing recorded yet</h1>
          <p className="dashboard__subline muted">Add your first income or expense to see where your money goes.</p>
          <Link className="button" to="/add">
            Add transaction
          </Link>
        </header>
      </div>
    );
  }

  const month = currentMonthKey();
  const monthLabel = monthName(month);
  const totals = totalsFor(transactions, month);
  const categories = spendingByCategory(transactions, month);
  const money = (cents: number) => formatMoney(cents, profile.currency);

  const hasThisMonth = totals.incomeCents > 0 || totals.spendingCents > 0;
  const headline = !hasThisMonth
    ? `Nothing recorded in ${monthLabel} yet`
    : totals.savedCents >= 0
      ? `You kept ${money(totals.savedCents)} in ${monthLabel}`
      : `You spent ${money(-totals.savedCents)} more than you earned in ${monthLabel}`;

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>{headline}</h1>
        {hasThisMonth && (
          <p className="dashboard__subline">
            <span className="income">{money(totals.incomeCents)}</span> came in and{" "}
            <span className="spending">{money(totals.spendingCents)}</span> went out.
          </p>
        )}
        <Link className="button" to="/add">
          Add transaction
        </Link>
      </header>

      <section className="panel" aria-labelledby="cashflow-heading">
        <h2 id="cashflow-heading">Last six months</h2>
        <CashflowChart data={monthlyCashflow(transactions)} currency={profile.currency} />
      </section>

      <div className="dashboard__columns">
        <section className="panel" aria-labelledby="categories-heading">
          <h2 id="categories-heading">Where {monthLabel}'s money went</h2>
          {categories.length > 0 ? (
            <CategoryChart data={categories} currency={profile.currency} />
          ) : (
            <p className="muted">No spending recorded in {monthLabel}.</p>
          )}
        </section>

        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading">Recent transactions</h2>
          <TransactionList transactions={transactions.slice(0, 10)} currency={profile.currency} />
        </section>
      </div>
    </div>
  );
}
