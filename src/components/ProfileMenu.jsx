import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiCreditCard, FiLock, FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div
      className={`profile-menu${open ? " is-open" : ""}`}
      ref={rootRef}
      onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
    >
      <button
        className="profile-menu-trigger"
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <FiUser aria-hidden="true" />
      </button>
      <div className="profile-menu-panel" role="menu">
        {user?.email && (
          <div className="profile-menu-email" title={user.email}>
            {user.email}
          </div>
        )}
        <Link to="/profile" role="menuitem" onClick={() => setOpen(false)}>
          <FiUser aria-hidden="true" />
          <span>Profile</span>
        </Link>
        <Link to="/change-password" role="menuitem" onClick={() => setOpen(false)}>
          <FiLock aria-hidden="true" />
          <span>Change Password</span>
        </Link>
        <Link to="/payments" role="menuitem" onClick={() => setOpen(false)}>
          <FiCreditCard aria-hidden="true" />
          <span>Manage Payments</span>
        </Link>
        <button type="button" role="menuitem" onClick={logout}>
          <FiLogOut aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
