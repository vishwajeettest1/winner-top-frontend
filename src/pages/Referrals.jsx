import React, { useEffect, useState } from "react";
import { FiCopy, FiSend, FiUsers } from "react-icons/fi";
import client from "../api/client";
import ClientPageHeader from "../components/ClientPageHeader.jsx";

const fallbackReferralHistory = [
  {
    _id: "ref-1",
    name: "Aisha",
    status: "Active",
    amount: 12.5,
    joinedAt: "2026-09-25",
  },
  {
    _id: "ref-2",
    name: "Milan",
    status: "Pending",
    amount: 8.0,
    joinedAt: "2026-09-28",
  },
  {
    _id: "ref-3",
    name: "Sonia",
    status: "Paid",
    amount: 16.0,
    joinedAt: "2026-09-22",
  },
];

function getFallbackReferralStats() {
  const origin = window.location.origin;

  return {
    referralLink: `${origin}/register?ref=SE-DEMO`,
    referralCode: "SE-DEMO",
    totalInvites: fallbackReferralHistory.length,
    activeReferrals: 1,
    pendingReferrals: 1,
    totalReferralEarnings: 36.5,
  };
}

export default function Referrals() {
  const [stats, setStats] = useState(() => getFallbackReferralStats());
  const [usingFallbackStats, setUsingFallbackStats] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");
  const [referralHistory, setReferralHistory] = useState(() => {
    const saved = localStorage.getItem("streamearn_referral_history");
    if (!saved) return fallbackReferralHistory;
    try {
      return JSON.parse(saved);
    } catch {
      return fallbackReferralHistory;
    }
  });

  useEffect(() => {
    client
      .get("/referrals/stats")
      .then((res) => {
        setStats(res.data);
        setUsingFallbackStats(false);
        if (
          Array.isArray(res.data?.referralHistory) &&
          res.data.referralHistory.length
        ) {
          setReferralHistory(res.data.referralHistory);
        }
      })
      .catch(() => {
        setUsingFallbackStats(true);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "streamearn_referral_history",
      JSON.stringify(referralHistory),
    );
  }, [referralHistory]);

  if (!stats) {
    return (
      <main className="client-page">
        <ClientPageHeader
          eyebrow="GROW TOGETHER"
          title="Invite friends"
          description="Earn a share of ad revenue when your referrals watch. It costs them nothing."
        />
        <div className="client-empty">Loading referral activity…</div>
      </main>
    );
  }

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopyMessage("Referral link copied");
    } catch {
      setCopyMessage("Copy unavailable. Select the link to copy it.");
    }
  }

  async function shareReferralLink() {
    if (!navigator.share) {
      await copyReferralLink();
      return;
    }

    try {
      await navigator.share({
        title: "Join me on StreamEarn",
        text: "Join me on StreamEarn and start earning rewards.",
        url: stats.referralLink,
      });
      setCopyMessage("Share sheet opened");
    } catch (error) {
      if (error.name !== "AbortError") setCopyMessage("Share unavailable");
    }
  }

  const activeEntries = referralHistory.filter(
    (entry) => entry.status === "Active",
  ).length;
  const pendingEntries = referralHistory.filter(
    (entry) => entry.status === "Pending",
  ).length;
  const totalEarnings = referralHistory.reduce(
    (sum, entry) => sum + Number(entry.amount || 0),
    0,
  );

  return (
    <main className="client-page referrals-page">
      <ClientPageHeader
        eyebrow="GROW TOGETHER"
        title="Invite friends"
        description="Earn a share of ad revenue when your referrals watch. It costs them nothing."
      />

      <section className="referral-share referral-hero">
        <div className="referral-hero-heading">
          <div>
            <span className="referral-share-label">YOUR INVITE LINK</span>
            <h2>Grow your circle</h2>
            <p>Share your link and earn when your referrals become active.</p>
          </div>
          <span className="referral-hero-icon" aria-hidden="true">
            <FiUsers />
          </span>
        </div>
        <label className="referral-link-field">
          <span className="sr-only">Referral link</span>
          <input
            value={stats.referralLink}
            readOnly
            onFocus={(event) => event.target.select()}
          />
          <button
            type="button"
            onClick={copyReferralLink}
            aria-label="Copy referral link"
          >
            <FiCopy aria-hidden="true" />
            <span>Copy</span>
          </button>
        </label>
        <button
          className="referral-share-button"
          type="button"
          onClick={shareReferralLink}
        >
          <FiSend aria-hidden="true" />
          <span>Share invite</span>
          <span aria-hidden="true">→</span>
        </button>
        <p>
          Invite code <strong>{stats.referralCode}</strong>
        </p>
        {usingFallbackStats && (
          <span className="referral-demo-note" role="note">
            Preview data is shown until your referral service connects.
          </span>
        )}
        {copyMessage && (
          <span className="referral-copy-message" role="status">
            {copyMessage}
          </span>
        )}
      </section>

      <section className="client-section referral-overview">
        <div className="client-section-heading">
          <h2>Your referral activity</h2>
          <span>ALL TIME</span>
        </div>
        <div className="referral-stats">
          <div>
            <span>TOTAL INVITES</span>
            <strong>{stats.totalInvites}</strong>
          </div>
          <div>
            <span>ACTIVE</span>
            <strong>{stats.activeReferrals ?? activeEntries}</strong>
          </div>
          <div>
            <span>PENDING</span>
            <strong>{stats.pendingReferrals ?? pendingEntries}</strong>
          </div>
          <div>
            <span>EARNINGS</span>
            <strong>
              ${(stats.totalReferralEarnings ?? totalEarnings).toFixed(2)}
            </strong>
          </div>
        </div>
      </section>

      <section className="client-section referral-status-section">
        <div className="client-section-heading">
          <h2>Referral status</h2>
          <span>{referralHistory.length} people</span>
        </div>

        <div className="referral-status-head" aria-hidden="true">
          <span>REFERRAL</span>
          <span>STATUS</span>
          <span>EARNED</span>
        </div>
        <div className="wallet-list referral-status-list">
          {referralHistory.map((entry) => (
            <article className="wallet-row" key={entry._id}>
              <span className="wallet-row-icon" aria-hidden="true">
                {entry.status === "Paid" ? "✓" : "↗"}
              </span>
              <div className="wallet-row-copy">
                <strong>{entry.name}</strong>
                <time dateTime={entry.joinedAt || entry.date}>
                  {new Date(entry.joinedAt || entry.date).toLocaleDateString()}
                </time>
              </div>
              <span className="wallet-row-status">{entry.status}</span>
              <strong className="wallet-row-amount">
                +${Number(entry.amount || 0).toFixed(2)}
              </strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
