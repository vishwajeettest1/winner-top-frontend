import React from "react";
import { NavLink } from "react-router-dom";

export default function BottomNav() {
  const items = [
    { to: "/", label: "Home", icon: "⌂", end: true },
    { to: "/watch", label: "Watch", icon: "▶" },
    { to: "/wallet", label: "Wallet", icon: "$" },
    { to: "/referrals", label: "Invite", icon: "+" },
    { to: "/withdrawals", label: "Withdraw", icon: "↗" },
    { to: "/help", label: "Help", icon: "?" },
  ];

  return (
    <nav className="nav">
      {items.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <span className="nav-icon" aria-hidden="true">
            {icon}
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
