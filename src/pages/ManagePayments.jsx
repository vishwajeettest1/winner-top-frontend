import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiCreditCard,
  FiList,
  FiSmartphone,
} from "react-icons/fi";
import client from "../api/client";
import ClientPageHeader from "../components/ClientPageHeader.jsx";
import PayoutSummary from "../components/PayoutSummary.jsx";

const emptyDetails = {
  name: "",
  upiId: "",
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  routingCode: "",
};

const options = [
  {
    to: "/wallet",
    icon: FiArrowDownCircle,
    title: "Add money",
    text: "Deposit via UPI or bank transfer and track your payment proofs.",
  },
  {
    to: "/withdrawals",
    icon: FiArrowUpCircle,
    title: "Withdraw",
    text: "Request a payout to your saved payout method.",
  },
  {
    to: "/wallet",
    icon: FiList,
    title: "Transaction history",
    text: "Review your wallet balance and recent transactions.",
  },
];

export default function ManagePayments() {
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [method, setMethod] = useState("");
  const [details, setDetails] = useState(emptyDetails);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    client
      .get("/user/payout-details")
      .then((res) => {
        if (!active) return;
        if (res.data.payoutMethod) {
          setSaved(res.data);
        } else {
          setEditing(true);
        }
      })
      .catch(() => {
        if (active) setError("Payout details are unavailable right now.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function startEditing() {
    setMethod(saved?.payoutMethod || "");
    setDetails(emptyDetails);
    setError("");
    setSuccess("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError("");
  }

  function updateField(name, value) {
    setDetails((current) => ({ ...current, [name]: value }));
    setError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!method) {
      setError("Choose UPI or Bank to continue.");
      return;
    }
    const payload =
      method === "UPI"
        ? { name: details.name.trim(), upiId: details.upiId.trim() }
        : {
            accountHolderName: details.accountHolderName.trim(),
            bankName: details.bankName.trim(),
            accountNumber: details.accountNumber.trim(),
            routingCode: details.routingCode.trim(),
          };
    if (Object.values(payload).some((value) => !value)) {
      setError("Complete all payout details to continue.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await client.put("/user/payout-details", {
        payoutMethod: method,
        payoutDetails: payload,
      });
      setSaved({
        payoutMethod: res.data.payoutMethod,
        payoutDetails: res.data.payoutDetails,
      });
      setDetails(emptyDetails);
      setEditing(false);
      setSuccess("Payout details saved.");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (err.response
            ? "Unable to save payout details."
            : "Can't reach the StreamEarn API."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="client-page account-page">
      <ClientPageHeader
        eyebrow="ACCOUNT"
        title="Manage payments"
        description="Save where you want to receive withdrawals. You only need to add this once."
      />

      <section className="account-card" aria-label="Payout details">
        <div className="account-card-heading">
          <h2>Payout details</h2>
          {saved && !editing && (
            <button
              type="button"
              className="account-secondary"
              onClick={startEditing}
            >
              Update
            </button>
          )}
        </div>

        {error && (
          <div className="client-feedback is-error" role="alert">
            {error}
          </div>
        )}
        {success && !editing && (
          <div className="client-feedback is-success" role="status">
            {success}
          </div>
        )}

        {loading && <p className="account-note">Loading…</p>}

        {!loading && saved && !editing && (
          <PayoutSummary
            method={saved.payoutMethod}
            details={saved.payoutDetails}
          />
        )}

        {!loading && editing && (
          <form className="account-form" onSubmit={handleSave}>
            <fieldset className="wallet-payment-methods withdrawal-payout-methods">
              <legend>Choose payout method</legend>
              <label className={method === "UPI" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="payout-method"
                  value="UPI"
                  checked={method === "UPI"}
                  onChange={(e) => {
                    setMethod(e.target.value);
                    setError("");
                  }}
                />
                <FiSmartphone aria-hidden="true" />
                <span>
                  <strong>UPI</strong>
                  <small>Receive your payout through UPI</small>
                </span>
              </label>
              <label className={method === "BANK" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="payout-method"
                  value="BANK"
                  checked={method === "BANK"}
                  onChange={(e) => {
                    setMethod(e.target.value);
                    setError("");
                  }}
                />
                <FiCreditCard aria-hidden="true" />
                <span>
                  <strong>Bank</strong>
                  <small>Receive your payout through bank transfer</small>
                </span>
              </label>
            </fieldset>

            {method === "UPI" && (
              <div className="withdrawal-destination-fields">
                <label className="admin-field">
                  <span>Name</span>
                  <input
                    autoComplete="name"
                    maxLength={120}
                    value={details.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Account holder name"
                    required
                  />
                </label>
                <label className="admin-field">
                  <span>UPI ID</span>
                  <input
                    autoComplete="off"
                    maxLength={120}
                    value={details.upiId}
                    onChange={(e) => updateField("upiId", e.target.value)}
                    placeholder="name@bank"
                    required
                  />
                </label>
              </div>
            )}

            {method === "BANK" && (
              <div className="withdrawal-destination-fields">
                <label className="admin-field">
                  <span>Account holder name</span>
                  <input
                    autoComplete="name"
                    maxLength={120}
                    value={details.accountHolderName}
                    onChange={(e) =>
                      updateField("accountHolderName", e.target.value)
                    }
                    required
                  />
                </label>
                <label className="admin-field">
                  <span>Bank name</span>
                  <input
                    autoComplete="organization"
                    maxLength={120}
                    value={details.bankName}
                    onChange={(e) => updateField("bankName", e.target.value)}
                    required
                  />
                </label>
                <label className="admin-field">
                  <span>Account number</span>
                  <input
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={34}
                    value={details.accountNumber}
                    onChange={(e) =>
                      updateField("accountNumber", e.target.value)
                    }
                    required
                  />
                </label>
                <label className="admin-field">
                  <span>IFSC / routing code</span>
                  <input
                    autoComplete="off"
                    maxLength={20}
                    value={details.routingCode}
                    onChange={(e) => updateField("routingCode", e.target.value)}
                    required
                  />
                </label>
              </div>
            )}

            <div className="account-actions">
              {saved && (
                <button
                  type="button"
                  className="account-secondary"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
              <button
                className="account-submit"
                type="submit"
                disabled={!method || saving}
              >
                {saving ? "Saving…" : "Save payout details"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="account-links" aria-label="Payment options">
        {options.map(({ to, icon: Icon, title, text }) => (
          <Link key={title} to={to} className="account-link">
            <span className="account-link-icon" aria-hidden="true">
              <Icon />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
