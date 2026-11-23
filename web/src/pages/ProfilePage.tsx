import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Avatar } from "../components/Avatar";
import { db, deleteAllTransactions, deleteProfile } from "../db/db";
import { exportBackup, importBackup, readBackup } from "../lib/backup";
import { CURRENCIES } from "../lib/categories";
import { resizeToSquare } from "../lib/image";
import { useProfile, useSession } from "../session/session";
import { applyThemePreference, readThemePreference, type ThemePreference } from "../theme/preference";

type Message = { kind: "ok" | "error"; text: string } | null;

const transactionCount = (n: number) => `${n} ${n === 1 ? "transaction" : "transactions"}`;

export function ProfilePage() {
  const profile = useProfile();
  const { logout } = useSession();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [currency, setCurrency] = useState(profile.currency);
  const [theme, setTheme] = useState<ThemePreference>(readThemePreference);
  const [profileMessage, setProfileMessage] = useState<Message>(null);
  const [dataMessage, setDataMessage] = useState<Message>(null);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setProfileMessage({ kind: "error", text: "Enter a name." });
      return;
    }
    // The login name follows the display name, so the new name opens this profile.
    const nameKey = trimmed.toLowerCase();
    const taken = await db.profiles.where("nameKey").equals(nameKey).first();
    if (taken && taken.id !== profile.id) {
      setProfileMessage({ kind: "error", text: `Another profile on this device is already called ${trimmed}.` });
      return;
    }
    await db.profiles.update(profile.id, { displayName: trimmed, nameKey, currency });
    setProfileMessage({ kind: "ok", text: "Changes saved." });
  }

  async function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await db.profiles.update(profile.id, { avatar: await resizeToSquare(file) });
      setProfileMessage({ kind: "ok", text: "Picture updated." });
    } catch {
      setProfileMessage({ kind: "error", text: "This file could not be read as an image. Try a JPEG or PNG." });
    }
  }

  function handleTheme(next: ThemePreference) {
    setTheme(next);
    applyThemePreference(next);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const backup = await readBackup(file);
      const fileCurrency = backup.profile.currency;
      if (
        fileCurrency !== profile.currency &&
        !confirm(
          `This file uses ${fileCurrency} and your profile uses ${profile.currency}. ` +
            `Amounts are imported as they are, with no conversion. Import anyway?`,
        )
      ) {
        setDataMessage({ kind: "ok", text: "Import cancelled. Nothing changed." });
        return;
      }

      const { added, skipped } = await importBackup(profile.id, backup);
      const skippedText = skipped > 0 ? ` Skipped ${transactionCount(skipped)} already in this profile.` : "";
      setDataMessage({ kind: "ok", text: `Imported ${transactionCount(added)}.${skippedText}` });
    } catch (error) {
      setDataMessage({ kind: "error", text: (error as Error).message });
    }
  }

  async function handleDeleteTransactions() {
    if (!confirm("Delete all transactions in this profile? This cannot be undone.")) return;
    const count = await deleteAllTransactions(profile.id);
    setDataMessage({ kind: "ok", text: `Deleted ${transactionCount(count)}.` });
  }

  async function handleDeleteProfile() {
    if (!confirm(`Delete the profile ${profile.displayName} and all its transactions? This cannot be undone.`)) return;
    await deleteProfile(profile.id);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="profile">
      <h1>Profile</h1>

      <section className="profile__section" aria-labelledby="details-heading">
        <h2 id="details-heading">Your details</h2>
        <div className="profile__avatar">
          <Avatar profile={profile} size={72} />
          <label className="button button--quiet">
            Change picture
            <input type="file" accept="image/*" className="visually-hidden" onChange={handleAvatar} />
          </label>
          {profile.avatar && (
            <button type="button" className="button button--quiet" onClick={() => db.profiles.update(profile.id, { avatar: undefined })}>
              Remove picture
            </button>
          )}
        </div>

        <form className="profile__form" onSubmit={handleSave}>
          <div className="field">
            <label htmlFor="display-name">Name</label>
            <input
              id="display-name"
              className="input"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="currency">Currency</label>
            <select id="currency" className="select" value={currency} onChange={(event) => setCurrency(event.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <button className="button" type="submit">
            Save changes
          </button>
          <p role="status" className={`form-message ${profileMessage?.kind === "error" ? "danger-text" : "income"}`}>
            {profileMessage?.text}
          </p>
        </form>
      </section>

      <section className="profile__section" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading">Appearance</h2>
        <fieldset className="segmented">
          <legend className="visually-hidden">Theme</legend>
          {(["system", "light", "dark"] as const).map((option) => (
            <label key={option} className="segmented__option">
              <input type="radio" name="theme" checked={theme === option} onChange={() => handleTheme(option)} />
              {option === "system" ? "Match device" : option === "light" ? "Light" : "Dark"}
            </label>
          ))}
        </fieldset>
      </section>

      <section className="profile__section" aria-labelledby="data-heading">
        <h2 id="data-heading">Your data</h2>
        <p className="muted">
          Transactions are stored in this browser only. Export a JSON file to keep a copy or to move it to the iOS app.
        </p>
        <div className="profile__actions">
          <button type="button" className="button button--quiet" onClick={() => exportBackup(profile)}>
            Export JSON
          </button>
          <label className="button button--quiet">
            Import JSON
            <input type="file" accept="application/json,.json" className="visually-hidden" onChange={handleImport} />
          </label>
          <button type="button" className="button button--danger" onClick={handleDeleteTransactions}>
            Delete all transactions
          </button>
        </div>
        <p role="status" className={`form-message ${dataMessage?.kind === "error" ? "danger-text" : "income"}`}>
          {dataMessage?.text}
        </p>
      </section>

      <section className="profile__section" aria-labelledby="account-heading">
        <h2 id="account-heading">Account</h2>
        <div className="profile__actions">
          <button type="button" className="button button--quiet" onClick={logout}>
            Log out
          </button>
          <button type="button" className="button button--danger" onClick={handleDeleteProfile}>
            Delete profile
          </button>
        </div>
      </section>
    </div>
  );
}
