import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiInbox,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiX,
} from "react-icons/fi";
import client from "../../api/client";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "RESOLVED", label: "Resolved" },
];

const STATUS_LABEL = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

const CATEGORY_LABEL = {
  ACCOUNT: "Account",
  WALLET: "Wallet",
  REFERRAL: "Referral",
  VIDEO: "Video",
  WITHDRAWAL: "Withdrawal",
  OTHER: "Other",
};

const EMPTY_COUNTS = { ALL: 0, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };

function formatDate(value) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminContactRequests() {
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("RESOLVED");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await client.get("/admin/contact-requests", {
        params: { status: filter },
      });
      setRequests(data.requests || []);
      setCounts(data.counts || EMPTY_COUNTS);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not load support questions. Check the admin API and retry.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((item) =>
      [item.subject, item.message, item.userEmail, item.userMobile]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [requests, search]);

  function openReply(item) {
    setActive(item);
    setReply(item.adminReply || "");
    setStatus(item.status === "OPEN" ? "RESOLVED" : item.status);
    setReplyError("");
  }

  function closeReply() {
    if (sending) return;
    setActive(null);
  }

  async function sendReply(event) {
    event.preventDefault();
    if (!reply.trim()) {
      setReplyError("Write an answer before sending.");
      return;
    }
    setSending(true);
    setReplyError("");
    try {
      await client.patch(`/admin/contact-requests/${active._id}`, {
        adminReply: reply,
        status,
      });
      setActive(null);
      setNotice("Answer sent to the user.");
      await load();
    } catch (err) {
      setReplyError(err.response?.data?.error || "Unable to send the answer.");
    } finally {
      setSending(false);
    }
  }

  const stats = [
    { key: "ALL", label: "Total questions", icon: FiMessageSquare },
    { key: "OPEN", label: "Awaiting answer", icon: FiInbox },
    { key: "IN_PROGRESS", label: "In progress", icon: FiClock },
    { key: "RESOLVED", label: "Resolved", icon: FiCheckCircle },
  ];

  return (
    <div className="container admin-table-page support-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">USER SUPPORT</p>
          <h2>Supports</h2>
          <p>Read the questions users have raised and answer each one.</p>
        </div>
        <div className="admin-payment-heading-actions">
          <span className="admin-count">{counts.ALL} questions</span>
          <button
            className="admin-refresh"
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Refresh support questions"
          >
            <FiRefreshCw
              className={loading ? "support-spin" : ""}
              aria-hidden="true"
            />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-notice admin-notice-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="admin-notice admin-notice-success" role="status">
          {notice}
        </div>
      )}

      <div className="support-stats">
        {stats.map(({ key, label, icon: Icon }, index) => (
          <button
            key={key}
            type="button"
            className={`support-stat support-stat-${key.toLowerCase()}${
              filter === key ? " is-active" : ""
            }`}
            style={{ animationDelay: `${index * 70}ms` }}
            onClick={() => setFilter(key)}
          >
            <span className="support-stat-icon">
              <Icon aria-hidden="true" />
            </span>
            <span className="support-stat-copy">
              <strong>{counts[key] ?? 0}</strong>
              <small>{label}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="support-toolbar">
        <div className="support-pills" role="tablist" aria-label="Status filter">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              className={filter === key ? "is-selected" : ""}
              onClick={() => setFilter(key)}
            >
              {label}
              <span>{counts[key] ?? 0}</span>
            </button>
          ))}
        </div>
        <label className="support-search">
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by user, subject or message"
          />
        </label>
      </div>

      {loading && requests.length === 0 ? (
        <div className="support-list" aria-busy="true">
          {[0, 1, 2].map((item) => (
            <div className="support-skeleton" key={item} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="support-empty">
          <span>
            <FiInbox aria-hidden="true" />
          </span>
          <strong>No questions here</strong>
          <p>
            {search
              ? "Nothing matches your search."
              : "New questions from users will appear here."}
          </p>
        </div>
      ) : (
        <div className="support-list">
          {visible.map((item, index) => (
            <article
              className={`support-card status-${item.status.toLowerCase()}`}
              key={item._id}
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
            >
              <header className="support-card-head">
                <span className="support-avatar" aria-hidden="true">
                  {(item.userEmail || "?").charAt(0).toUpperCase()}
                </span>
                <div className="support-card-user">
                  <strong>{item.userEmail}</strong>
                  <small>
                    {item.userMobile} · {formatDate(item.createdAt)}
                  </small>
                </div>
                <div className="support-card-tags">
                  <span className="support-tag">
                    {CATEGORY_LABEL[item.category] || item.category}
                  </span>
                  <span
                    className={`support-state state-${item.status.toLowerCase()}`}
                  >
                    {STATUS_LABEL[item.status] || item.status}
                  </span>
                </div>
              </header>

              <h3>{item.subject}</h3>
              <p className="support-question">{item.message}</p>

              {item.adminReply && (
                <div className="support-answer">
                  <span>
                    <FiCheckCircle aria-hidden="true" /> Your answer
                    {item.repliedAt ? ` · ${formatDate(item.repliedAt)}` : ""}
                  </span>
                  <p>{item.adminReply}</p>
                </div>
              )}

              <footer>
                <button
                  type="button"
                  className="support-reply-btn"
                  onClick={() => openReply(item)}
                >
                  <FiSend aria-hidden="true" />
                  {item.adminReply ? "Edit answer" : "Answer question"}
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {active && (
        <div
          className="support-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeReply();
          }}
        >
          <form
            className="support-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-dialog-title"
            onSubmit={sendReply}
          >
            <div className="support-dialog-head">
              <div>
                <p className="admin-eyebrow">ANSWER QUESTION</p>
                <h3 id="support-dialog-title">{active.subject}</h3>
                <small>
                  {active.userEmail} · {active.userMobile}
                </small>
              </div>
              <button
                type="button"
                className="support-close"
                onClick={closeReply}
                aria-label="Close"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <blockquote className="support-quote">{active.message}</blockquote>

            <label className="admin-field">
              <span>Your answer</span>
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                maxLength={5000}
                rows={6}
                placeholder="Type the answer the user will see..."
                autoFocus
              />
              <small className="support-counter">{reply.length}/5000</small>
            </label>

            <label className="admin-field">
              <span>Mark question as</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="OPEN">Open</option>
              </select>
            </label>

            {replyError && (
              <div className="admin-notice admin-notice-error" role="alert">
                {replyError}
              </div>
            )}

            <div className="support-dialog-actions">
              <button
                type="button"
                className="support-ghost-btn"
                onClick={closeReply}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="support-reply-btn"
                disabled={sending || !reply.trim()}
              >
                <FiSend aria-hidden="true" />
                {sending ? "Sending..." : "Send answer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
