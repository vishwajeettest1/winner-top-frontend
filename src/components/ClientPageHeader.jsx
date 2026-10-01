import React from "react";
import { Link } from "react-router-dom";

export default function ClientPageHeader({ eyebrow, title, description }) {
  return (
    <header className="client-page-header">
      <Link className="client-brand" to="/" aria-label="StreamEarn home">
        <span className="client-brand-mark">S</span>
        <span>
          stream<span>earn</span>
        </span>
      </Link>
      <div className="client-page-intro">
        <span className="client-page-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}
