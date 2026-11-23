import { NavLink, Outlet } from "react-router";
import { useProfile } from "../session/session";
import { Avatar } from "./Avatar";

const LINKS = [
  { to: "/", label: "Overview" },
  { to: "/add", label: "Add" },
  { to: "/news", label: "News" },
  { to: "/profile", label: "Profile" },
];

export function Layout() {
  const profile = useProfile();

  return (
    <div className="app">
      <nav className="nav" aria-label="Main">
        <p className="nav__brand">Savings tracker</p>
        <ul className="nav__links">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.to === "/"} className="nav__link">
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="nav__profile">
          <Avatar profile={profile} size={32} />
          <span>{profile.displayName}</span>
        </div>
      </nav>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
