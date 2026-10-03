import React from "react";
import { Link } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";

export default function ClientPageHeader({ eyebrow, title, description }) {
  const { logout } = useAuth();

  return (
    <header className="client-page-header">
      <div className="client-page-header-top">
        <Link className="client-brand" to="/" aria-label="StreamEarn home">
          <span className="client-brand-mark">S</span>
          <span>
            stream<span>earn</span>
          </span>
        </Link>
        <button
          className="home-logout"
          type="button"
          onClick={logout}
          aria-label="Log out"
        >
          <span className="home-logout-icon" aria-hidden="true">
            <FiLogOut />
          </span>
          <span>Log out</span>
        </button>
      </div>
      <div className="client-page-intro">
        <span className="client-page-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}
