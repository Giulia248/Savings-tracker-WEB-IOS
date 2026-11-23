import { useState, type FormEvent } from "react";
import { db, type TransactionType } from "../db/db";
import { CATEGORIES } from "../lib/categories";
import { formatMoney, parseAmount, todayISO } from "../lib/format";
import { useProfile } from "../session/session";

export function AddTransactionPage() {
  const profile = useProfile();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [date, setDate] = useState(todayISO);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function changeType(next: TransactionType) {
    setType(next);
    setCategory(CATEGORIES[next][0]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const amountCents = parseAmount(amount);
    if (amountCents == null) {
      setMessage({ kind: "error", text: "Enter an amount greater than zero, for example 12.50." });
      return;
    }

    await db.transactions.add({
      profileId: profile.id,
      type,
      amountCents,
      category,
      date,
      note: note.trim(),
      createdAt: Date.now(),
    });

    const label = type === "income" ? "Income" : "Expense";
    setMessage({ kind: "ok", text: `${label} added: ${category}, ${formatMoney(amountCents, profile.currency)}.` });
    setAmount("");
    setNote("");
  }

  return (
    <div className="add">
      <h1>Add transaction</h1>

      <form className="add__form" onSubmit={handleSubmit}>
        <fieldset className="segmented">
          <legend className="visually-hidden">Type</legend>
          {(["expense", "income"] as const).map((option) => (
            <label key={option} className={`segmented__option segmented__option--${option}`}>
              <input
                type="radio"
                name="type"
                value={option}
                checked={type === option}
                onChange={() => changeType(option)}
              />
              {option === "expense" ? "Expense" : "Income"}
            </label>
          ))}
        </fieldset>

        <div className="field">
          <label htmlFor="amount">Amount ({profile.currency})</label>
          <input
            id="amount"
            className="input input--amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </div>

        <div className="add__row">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              className="select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {CATEGORIES[type].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              className="input"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="note">Note (optional)</label>
          <textarea id="note" className="input" value={note} onChange={(event) => setNote(event.target.value)} />
        </div>

        <button className="button" type="submit">
          {type === "income" ? "Add income" : "Add expense"}
        </button>

        <p role="status" className={`form-message ${message?.kind === "error" ? "danger-text" : "income"}`}>
          {message?.text}
        </p>
      </form>
    </div>
  );
}
