import React, { useEffect, useState } from "react";
import {
  FiChevronDown,
  FiCopy,
  FiRefreshCw,
  FiSend,
  FiUsers,
} from "react-icons/fi";
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

function getReferralTimestamp(entry) {
  const date = new Date(
    entry.lastActivityAt ||
      entry.joinedAt ||
      entry.createdAt ||
      entry.date ||
      0,
  ).getTime();
  return Number.isNaN(date) ? 0 : date;
}

function sortReferralHistory(entries) {
  if (!Array.isArray(entries)) return [...fallbackReferralHistory];
  return [...entries].sort(
    (first, second) =>
      getReferralTimestamp(second) - getReferralTimestamp(first),
  );
}

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
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [expandedReferralId, setExpandedReferralId] = useState(null);
  const [referralHistory, setReferralHistory] = useState(() => {
    const saved = localStorage.getItem("streamearn_referral_history");
    if (!saved) return sortReferralHistory(fallbackReferralHistory);
    try {
      return sortReferralHistory(JSON.parse(saved));
    } catch {
      return sortReferralHistory(fallbackReferralHistory);
    }
  });

  async function loadReferralData() {
    setRefreshing(true);
    try {
      const response = await client.get("/referrals/stats");
      setStats(response.data);
      setUsingFallbackStats(false);
      setReferralHistory(
        sortReferralHistory(
          Array.isArray(response.data?.referralHistory)
            ? response.data.referralHistory
            : [],
        ),
      );
      setRefreshError("");
    } catch {
      setUsingFallbackStats(true);
      setRefreshError("Referral activity could not be refreshed.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadReferralData();
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

  const activeEntries = referralHistory.filter((entry) =>
    ["ACTIVE", "PAID"].includes(String(entry.status).toUpperCase()),
  ).length;
  const pendingEntries = referralHistory.filter(
    (entry) => String(entry.status).toUpperCase() === "PENDING",
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
          <div className="wallet-history-controls">
            <span className="wallet-history-count">
              {referralHistory.length}{" "}
              {referralHistory.length === 1 ? "person" : "people"}
            </span>
            <button
              className="wallet-history-refresh"
              type="button"
              onClick={loadReferralData}
              disabled={refreshing}
              aria-label="Refresh referral history"
            >
              <FiRefreshCw
                className={refreshing ? "is-refreshing" : ""}
                aria-hidden="true"
              />
              <span>{refreshing ? "Refreshing" : "Refresh"}</span>
            </button>
          </div>
        </div>
        {refreshError && (
          <p className="client-empty compact" role="status">
            {refreshError}
          </p>
        )}
        {referralHistory.length ? (
          <div className="wallet-list referral-status-list">
            {referralHistory.map((entry) => {
              const referralId = entry._id || entry.id;
              const status = String(entry.status || "PENDING").toUpperCase();
              const dateValue = entry.joinedAt || entry.createdAt || entry.date;
              const joinedDate = dateValue ? new Date(dateValue) : null;
              const isValidJoinedDate =
                joinedDate && !Number.isNaN(joinedDate.getTime());
              const details = [
                ["Referral", entry.name || "Referral"],
                ["Status", status.replaceAll("_", " ")],
                ["Earned", `+$${Number(entry.amount || 0).toFixed(2)}`],
                [
                  "Joined",
                  isValidJoinedDate
                    ? joinedDate.toLocaleString()
                    : "Date unavailable",
                ],
                [
                  "Latest activity",
                  entry.lastActivityAt
                    ? new Date(entry.lastActivityAt).toLocaleString()
                    : null,
                ],
              ].filter(
                ([, value]) =>
                  value !== undefined && value !== null && value !== "",
              );

              return (
                <article className="wallet-history-item" key={referralId}>
                  <button
                    className="wallet-row wallet-history-row wallet-history-trigger referral-history-row"
                    type="button"
                    aria-expanded={expandedReferralId === referralId}
                    aria-controls={`referral-details-${referralId}`}
                    onClick={() =>
                      setExpandedReferralId((current) =>
                        current === referralId ? null : referralId,
                      )
                    }
                  >
                    <span className="wallet-row-icon" aria-hidden="true">
                      {status === "PAID" ? "✓" : "+"}
                    </span>
                    <span className="wallet-row-copy wallet-history-copy">
                      <strong>{entry.name || "Referral"}</strong>
                      <time
                        dateTime={
                          isValidJoinedDate
                            ? joinedDate.toISOString()
                            : undefined
                        }
                      >
                        {isValidJoinedDate
                          ? joinedDate.toLocaleDateString()
                          : "Date unavailable"}
                      </time>
                    </span>
                    <span className="wallet-history-details">
                      <span
                        className={`wallet-row-status wallet-history-status status-${status.toLowerCase().replaceAll("_", "-")}`}
                      >
                        {status.replaceAll("_", " ")}
                      </span>
                    </span>
                    <strong className="wallet-row-amount">
                      +${Number(entry.amount || 0).toFixed(2)}
                    </strong>
                    <FiChevronDown
                      className="wallet-history-chevron"
                      aria-hidden="true"
                    />
                  </button>
                  {expandedReferralId === referralId && (
                    <div
                      className="wallet-history-expanded"
                      id={`referral-details-${referralId}`}
                    >
                      <dl className="wallet-history-fields">
                        {details.map(([label, value]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="client-empty compact">No referral activity yet.</p>
        )}
      </section>
    </main>
  );
}
