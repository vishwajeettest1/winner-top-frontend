import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiCreditCard,
  FiDollarSign,
  FiGrid,
  FiLogOut,
  FiUsers,
  FiVideo,
  FiMessageSquare,
} from "react-icons/fi";

const navigation = [
  { to: "/admin", label: "Overview", icon: FiGrid, end: true },
  { to: "/admin/users", label: "Users", icon: FiUsers },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: FiCreditCard },
  { to: "/admin/supports", label: "Supports", icon: FiMessageSquare },
  { to: "/admin/content", label: "Video content", icon: FiVideo },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDepositRoute = location.pathname.startsWith("/admin/deposits");
  const [depositsOpen, setDepositsOpen] = useState(isDepositRoute);

  useEffect(() => {
    if (isDepositRoute) setDepositsOpen(true);
  }, [isDepositRoute]);

  function signOut() {
    localStorage.removeItem("streamearn_admin_token");
    localStorage.removeItem("streamearn_token");
    navigate("/login", { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-mobile-brand-row">
          <button
            className="home-logout admin-mobile-brand-logout"
            type="button"
            onClick={signOut}
          >
            <span className="home-logout-icon" aria-hidden="true">
              <FiLogOut />
            </span>
            <span>Log out</span>
          </button>
          <div className="admin-brand">
            <span className="admin-brand-mark">W</span>
            <span>
              WINNER TOP<small>ADMINISTRATION</small>
            </span>
          </div>
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
          <div
            className={`admin-nav-group${isDepositRoute ? " is-active" : ""}`}
          >
            <button
              className={`admin-nav-link admin-nav-toggle${isDepositRoute ? " is-active" : ""}`}
              type="button"
              aria-expanded={depositsOpen}
              onClick={() => setDepositsOpen((open) => !open)}
            >
              <FiDollarSign aria-hidden="true" />
              <span>Wallet Deposits</span>
              <FiChevronDown className="admin-nav-chevron" aria-hidden="true" />
            </button>
            {depositsOpen && (
              <div className="admin-subnav">
                <NavLink
                  to="/admin/deposits"
                  end
                  className={({ isActive }) =>
                    `admin-subnav-link${isActive ? " is-active" : ""}`
                  }
                >
                  Wallet Deposit Payment
                </NavLink>
                <NavLink
                  to="/admin/deposits/history"
                  className={({ isActive }) =>
                    `admin-subnav-link${isActive ? " is-active" : ""}`
                  }
                >
                  Wallet Deposit History
                </NavLink>
              </div>
            )}
          </div>
        </nav>
        <div className="admin-sidebar-bottom">
          <span className="admin-access-label">
            <span /> ADMIN ACCESS
          </span>
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
            className="home-logout admin-desktop-logout"
            type="button"
            onClick={signOut}
          >
            <span className="home-logout-icon" aria-hidden="true">
              <FiLogOut />
            </span>
            <span>Log out</span>
          </button>
        </header>
        <div className="admin-page-content">{children}</div>
      </main>
    </div>
  );
}
