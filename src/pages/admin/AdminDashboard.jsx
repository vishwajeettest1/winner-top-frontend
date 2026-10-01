import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiRefreshCw } from "react-icons/fi";
import client from "../../api/client";

const initialData = {
  ledger: null,
  users: [],
  withdrawals: [],
  videos: [],
  campaigns: [],
  loading: true,
  failed: false,
};

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function AdminDashboard() {
  const [data, setData] = useState(initialData);

  async function loadOverview() {
    setData((current) => ({ ...current, loading: true }));
    const results = await Promise.allSettled([
      client.get("/admin/ledger"),
      client.get("/admin/users"),
      client.get("/admin/withdrawals", { params: { status: "PENDING" } }),
      client.get("/admin/videos"),
      client.get("/admin/sponsored-content"),
    ]);
    const value = (index, key) =>
      results[index].status === "fulfilled"
        ? results[index].value.data?.[key]
        : null;
    setData({
      ledger: results[0].status === "fulfilled" ? results[0].value.data : null,
      users: value(1, "users") || [],
      withdrawals: value(2, "withdrawals") || [],
      videos: value(3, "videos") || [],
      campaigns: value(4, "campaigns") || [],
      loading: false,
      failed: results.some((result) => result.status === "rejected"),
    });
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const activeContent =
    data.videos.filter((video) => video.isActive).length +
    data.campaigns.filter((campaign) => campaign.isActive).length;
  const metrics = [
    {
      label: "Registered users",
      value: data.users.length,
      note: "All accounts",
    },
    {
      label: "Active content",
      value: activeContent,
      note: `${data.videos.length + data.campaigns.length} total items`,
    },
    {
      label: "Pending withdrawals",
      value: data.withdrawals.length,
      note: "Awaiting review",
    },
    {
      label: "Platform margin",
      value: data.ledger ? money(data.ledger.platformMargin) : "—",
      note: "Lifetime ledger",
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">BUSINESS SNAPSHOT</p>
          <h2>Overview</h2>
          <p>
            Monitor platform activity and jump into work that needs attention.
          </p>
        </div>
        <button
          className="admin-refresh"
          type="button"
          onClick={loadOverview}
          disabled={data.loading}
        >
          <FiRefreshCw aria-hidden="true" /> Refresh
        </button>
      </div>

      {data.failed && (
        <div className="admin-notice" role="status">
          Some overview data could not be loaded. Check the admin API and
          refresh.
        </div>
      )}

      <div className="admin-metrics">
        {metrics.map((metric, index) => (
          <article
            className={`admin-metric metric-${index + 1}`}
            key={metric.label}
          >
            <span>{metric.label}</span>
            <strong>{data.loading ? "..." : metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </div>

      <div className="admin-overview-grid">
        <section className="admin-section admin-ledger-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">FINANCIALS</span>
              <h3>Ledger summary</h3>
            </div>
          </div>
          {data.ledger ? (
            <dl className="admin-ledger-list">
              <div>
                <dt>Ad-network revenue</dt>
                <dd>{money(data.ledger.adNetworkRevenue)}</dd>
              </div>
              <div>
                <dt>Sponsored revenue</dt>
                <dd>{money(data.ledger.sponsoredRevenue)}</dd>
              </div>
              <div>
                <dt>Total gross revenue</dt>
                <dd>{money(data.ledger.totalGrossRevenue)}</dd>
              </div>
              <div>
                <dt>Paid to users</dt>
                <dd>{money(data.ledger.totalPaidToUsers)}</dd>
              </div>
              <div>
                <dt>Paid to referrers</dt>
                <dd>{money(data.ledger.totalPaidToReferrers)}</dd>
              </div>
              <div className="admin-ledger-total">
                <dt>Platform margin</dt>
                <dd>{money(data.ledger.platformMargin)}</dd>
              </div>
            </dl>
          ) : (
            <p className="admin-empty">Ledger data is unavailable.</p>
          )}
        </section>

        <section className="admin-section admin-actions-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">WORK QUEUE</span>
              <h3>Admin tools</h3>
            </div>
          </div>
          <Link className="admin-action-link" to="/admin/users">
            <span>
              Manage users<small>Review accounts and access</small>
            </span>
            <FiArrowUpRight aria-hidden="true" />
          </Link>
          <Link className="admin-action-link" to="/admin/withdrawals">
            <span>
              Review withdrawals
              <small>{data.withdrawals.length} awaiting review</small>
            </span>
            <FiArrowUpRight aria-hidden="true" />
          </Link>
          <Link className="admin-action-link" to="/admin/content">
            <span>
              Manage video content<small>Upload videos and campaigns</small>
            </span>
            <FiArrowUpRight aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
