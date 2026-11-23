import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Navigate, Outlet } from "react-router";
import { db, toNameKey, type Profile } from "../db/db";

const STORAGE_KEY = "savings-tracker.profileId";

function readStoredId(): number | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

function storeId(id: number | null): void {
  try {
    if (id == null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, String(id));
  } catch {
    // Storage can be blocked. The session then lasts until the page reloads.
  }
}

interface SessionValue {
  /** "loading" until IndexedDB answers, null when nobody is logged in. */
  profile: Profile | null | "loading";
  login: (name: string) => Promise<void>;
  logout: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileId] = useState(readStoredId);

  const profile = useLiveQuery(
    async () => (profileId == null ? null : ((await db.profiles.get(profileId)) ?? null)),
    [profileId],
    "loading" as const,
  );

  const login = useCallback(async (name: string) => {
    const nameKey = toNameKey(name);
    const existing = await db.profiles.where("nameKey").equals(nameKey).first();
    const id =
      existing?.id ??
      (await db.profiles.add({ nameKey, displayName: name.trim(), currency: "EUR", createdAt: Date.now() }));
    storeId(id);
    setProfileId(id);
  }, []);

  const logout = useCallback(() => {
    storeId(null);
    setProfileId(null);
  }, []);

  const value = useMemo(() => ({ profile, login, logout }), [profile, login, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

/** For pages behind RequireProfile, where a profile always exists. */
export function useProfile(): Profile {
  const { profile } = useSession();
  if (profile === null || profile === "loading") throw new Error("useProfile needs a logged-in profile");
  return profile;
}

export function RequireProfile() {
  const { profile } = useSession();
  if (profile === "loading") return null;
  if (profile === null) return <Navigate to="/login" replace />;
  return <Outlet />;
}
