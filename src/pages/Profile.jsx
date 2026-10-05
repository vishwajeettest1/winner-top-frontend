import React from "react";
import ClientPageHeader from "../components/ClientPageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export default function Profile() {
  const { user, profileError } = useAuth();

  const rows = [
    ["Email", user?.email],
    ["Mobile number", user?.mobileNumber],
    ["Referral code", user?.referralCode],
    ["Account status", user?.status],
    ["Starter plan", user?.starterPlanActive ? "Active" : "Not active"],
    ["Member since", formatDate(user?.createdAt)],
  ];

  return (
    <main className="client-page account-page">
      <ClientPageHeader
        eyebrow="ACCOUNT"
        title="Your profile"
        description="Your account details as stored with StreamEarn."
      />
      {profileError && (
        <div className="client-feedback is-error" role="alert">
          {profileError}
        </div>
      )}
      <section className="account-card" aria-label="Profile details">
        <dl className="account-details">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
