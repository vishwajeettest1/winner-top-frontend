import React from "react";
import { Link } from "react-router-dom";
import ProfileMenu from "./ProfileMenu.jsx";

export default function ClientPageHeader({ eyebrow, title, description }) {
  return (
    <header className="client-page-header">
      <div className="client-page-header-top">
        <Link className="client-brand" to="/" aria-label="StreamEarn home">
          <span className="client-brand-mark">S</span>
          <span>
            stream<span>earn</span>
          </span>
        </Link>
        <ProfileMenu />
      </div>
      <div className="client-page-intro">
        <span className="client-page-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}
