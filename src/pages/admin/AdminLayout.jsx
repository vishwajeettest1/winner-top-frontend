import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiUsers,
  FiVideo,
} from "react-icons/fi";

const navigation = [
  { to: "/admin", label: "Overview", icon: FiGrid, end: true },
  { to: "/admin/users", label: "Users", icon: FiUsers },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: FiCreditCard },
  { to: "/admin/content", label: "Video content", icon: FiVideo },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();

  function signOut() {
    localStorage.removeItem("streamearn_admin_token");
    localStorage.removeItem("streamearn_token");
    navigate("/login", { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">W</span>
          <span>
            WINNER TOP<small>ADMINISTRATION</small>
          </span>
        </div>
        <nav className="admin-navigation" aria-label="Admin navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `admin-nav-link${isActive ? " is-active" : ""}`
              }
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <span className="admin-access-label">
            <span /> ADMIN ACCESS
          </span>
          <button className="admin-signout" type="button" onClick={signOut}>
            <FiLogOut aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-kicker">
              WINNER TOP / CONTROL ROOM
            </span>
            <h1>Platform management</h1>
          </div>
          <button
            className="admin-mobile-signout"
            type="button"
            onClick={signOut}
            aria-label="Sign out"
          >
            <FiLogOut aria-hidden="true" />
          </button>
        </header>
        <div className="admin-page-content">{children}</div>
      </main>
    </div>
  );
}
