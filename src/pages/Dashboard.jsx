import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiPlus } from "react-icons/fi";
import client from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

const STARTER_AMOUNT = 25;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(
    Boolean(location.state?.accountVerified),
  );

  useEffect(() => {
    const refreshWallet = () => {
      client.get("/wallet/balance").then((res) => setWallet(res.data.wallet));
    };

    refreshWallet();
    window.addEventListener("wallet:updated", refreshWallet);

    return () => window.removeEventListener("wallet:updated", refreshWallet);
  }, []);

  useEffect(() => {
    if (!location.state?.accountVerified) return undefined;

    const timeout = window.setTimeout(() => {
      setShowVerifiedMessage(false);
      navigate(location.pathname, { replace: true, state: null });
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [location.pathname, location.state?.accountVerified, navigate]);

  function activateStarterPlan() {
    navigate("/wallet", { state: { starterAmount: STARTER_AMOUNT } });
  }

  const starterActive = Boolean(
    wallet?.starterPlanActive || wallet?.starterActivatedAt,
  );
  const totalBalance = Number(wallet?.totalBalance || 0);

  return (
    <main className="home-dashboard">
      <header className="home-header">
        <Link className="home-brand" to="/" aria-label="StreamEarn home">
          <span className="home-brand-mark">S</span>
          <span>
            stream<span>earn</span>
          </span>
        </Link>
        <button className="home-logout" onClick={logout} aria-label="Log out">
          <span className="home-logout-icon" aria-hidden="true">
            <FiLogOut />
          </span>
          <span>Log out</span>
        </button>
      </header>

      {showVerifiedMessage && (
        <div
          className="client-feedback is-success home-success-banner"
          role="status"
          aria-live="polite"
        >
          <span className="home-success-check" aria-hidden="true">
            ✓
          </span>
          <span>
            Account created and verified successfully. Welcome to StreamEarn!
          </span>
        </div>
      )}

      <section className="home-welcome">
        <span className="home-eyebrow">YOUR STREAM EARN HOME</span>
        <h1>
          Ready to <em>earn?</em>
        </h1>
        <p>
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}. Your
          next reward starts with a watch.
        </p>
      </section>

      <section className="home-balance" aria-label="Earnings summary">
        <div className="home-balance-top">
          <span className="home-balance-label">TOTAL BALANCE</span>
          <span className="home-balance-symbol" aria-hidden="true">
            ✳
          </span>
        </div>
        <div className="home-balance-value-row">
          <div className="home-balance-value">${totalBalance.toFixed(2)}</div>
          <Link className="home-add-balance" to="/wallet">
            <FiPlus aria-hidden="true" />
            <span>Add balance</span>
          </Link>
        </div>
        <div className="home-earnings-row">
          <div>
            <span>VIDEO EARNINGS</span>
            <strong>${wallet?.videoEarnings?.toFixed(2) ?? "0.00"}</strong>
          </div>
          <div>
            <span>REFERRAL EARNINGS</span>
            <strong>${wallet?.referralEarnings?.toFixed(2) ?? "0.00"}</strong>
          </div>
        </div>
      </section>

      <section className="client-section" aria-label="Starter earning setup">
        <div className="client-section-heading">
          <h2>Starter plan</h2>
          <span>{starterActive ? "ACTIVE" : "READY"}</span>
        </div>

        <div className="referral-stats">
          <div>
            <span>FIXED AMOUNT</span>
            <strong>${STARTER_AMOUNT.toFixed(2)}</strong>
          </div>
          <div>
            <span>STATUS</span>
            <strong>{starterActive ? "Activated" : "Payment required"}</strong>
          </div>
        </div>

        <button
          type="button"
          className="register-submit"
          onClick={activateStarterPlan}
          style={{ marginTop: 12 }}
          disabled={starterActive}
        >
          <span className="register-submit-label">
            {starterActive ? "Starter plan active" : "Add $25.00 to activate"}
          </span>
          {!starterActive && (
            <span aria-hidden="true">
              <FiPlus />
            </span>
          )}
        </button>
      </section>

      <Link to="/watch" className="home-watch-cta">
        <span className="home-play-icon" aria-hidden="true">
          ▶
        </span>
        <span className="home-cta-copy">
          <strong>Watch videos &amp; earn</strong>
          <span>Turn a few minutes into rewards</span>
        </span>
        <span className="home-cta-arrow" aria-hidden="true">
          →
        </span>
      </Link>

      <section className="home-shortcuts" aria-label="Account shortcuts">
        <Link to="/wallet">
          <span className="home-shortcut-icon" aria-hidden="true">
            $
          </span>
          <span>
            <strong>Your wallet</strong>
            <small>Review your balance</small>
          </span>
          <span className="home-shortcut-arrow" aria-hidden="true">
            ↗
          </span>
        </Link>
        <Link to="/referrals">
          <span className="home-shortcut-icon" aria-hidden="true">
            +
          </span>
          <span>
            <strong>Invite friends</strong>
            <small>Earn from referrals</small>
          </span>
          <span className="home-shortcut-arrow" aria-hidden="true">
            ↗
          </span>
        </Link>
        <Link to="/about" className="home-shortcut-about">
          <span className="home-shortcut-icon" aria-hidden="true">
            i
          </span>
          <span>
            <strong>About StreamEarn</strong>
            <small>Learn about our mission and team</small>
          </span>
          <span className="home-shortcut-arrow" aria-hidden="true">
            ↗
          </span>
        </Link>
      </section>

      <p className="home-footer-note">
        <span aria-hidden="true">✳</span> Start earning with a fixed $
        {STARTER_AMOUNT.toFixed(2)} activation.
      </p>
    </main>
  );
}
