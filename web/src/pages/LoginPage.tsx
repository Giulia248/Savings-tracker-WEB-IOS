import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Navigate } from "react-router";
import { Avatar } from "../components/Avatar";
import { db } from "../db/db";
import { useSession } from "../session/session";

export function LoginPage() {
  const { profile, login } = useSession();
  const [name, setName] = useState("");
  const profiles = useLiveQuery(() => db.profiles.orderBy("nameKey").toArray(), [], []);

  if (profile !== null && profile !== "loading") return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim()) await login(name);
  }

  return (
    <main className="login">
      <div className="login__inner">
        <h1>Savings tracker</h1>
        <p className="login__intro muted">
          Enter your name to open your profile. A new name creates a new profile. Everything stays on this device.
        </p>

        <form className="login__form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              className="input"
              autoComplete="nickname"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <button className="button" type="submit" disabled={!name.trim()}>
            Open profile
          </button>
        </form>

        {profiles.length > 0 && (
          <section className="login__profiles" aria-labelledby="profiles-heading">
            <h2 id="profiles-heading">Profiles on this device</h2>
            <ul>
              {profiles.map((p) => (
                <li key={p.id}>
                  <button type="button" className="profile-pick" onClick={() => login(p.displayName)}>
                    <Avatar profile={p} size={36} />
                    {p.displayName}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
