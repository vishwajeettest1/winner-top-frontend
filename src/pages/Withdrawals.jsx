import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiChevronDown,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import client from "../api/client";
import ClientPageHeader from "../components/ClientPageHeader.jsx";
import PayoutSummary from "../components/PayoutSummary.jsx";

const WITHDRAWAL_WINDOW_DAYS = 7;
const MIN_WITHDRAWAL_AMOUNT = 100;

function getExpectedWithdrawalDate(createdAt) {
  const date = new Date(createdAt || Date.now());
  date.setDate(date.getDate() + WITHDRAWAL_WINDOW_DAYS);
  return date;
}

function getCountdownParts(createdAt) {
  const now = new Date();
  const deadline = getExpectedWithdrawalDate(createdAt);
  const msLeft = deadline.getTime() - now.getTime();

  if (msLeft <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const totalSeconds = Math.floor(msLeft / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, expired: false };
}

function getWithdrawalTimestamp(withdrawal) {
  const date = new Date(
    withdrawal.requestedAt || withdrawal.createdAt || 0,
  ).getTime();
  return Number.isNaN(date) ? 0 : date;
}

export default function Withdrawals() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [expandedWithdrawalId, setExpandedWithdrawalId] = useState(null);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [savedPayout, setSavedPayout] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [withdrawalSubmitting, setWithdrawalSubmitting] = useState(false);
  const [withdrawalDialogError, setWithdrawalDialogError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!withdrawalDialogOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !withdrawalSubmitting) {
        closeWithdrawalDialog();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [withdrawalDialogOpen, withdrawalSubmitting]);

  const activeWithdrawalWindow = useMemo(() => {
    const latestRequest =
      history.find((entry) => entry?.status === "PENDING") || history[0];
    if (!latestRequest) return null;

    return {
      createdAt:
        latestRequest.requestedAt || latestRequest.createdAt || Date.now(),
      deadline: getExpectedWithdrawalDate(
        latestRequest.requestedAt || latestRequest.createdAt || Date.now(),
      ),
      countdown: getCountdownParts(
        latestRequest.requestedAt || latestRequest.createdAt || Date.now(),
      ),
    };
  }, [history, now]);

  async function loadHistory() {
    setHistoryRefreshing(true);
    try {
      const response = await client.get("/withdrawals/history");
      setHistory(
        (response.data.withdrawals || []).sort(
          (first, second) =>
            getWithdrawalTimestamp(second) - getWithdrawalTimestamp(first),
        ),
      );
      setHistoryError("");
    } catch {
      setHistoryError("Withdrawal history is unavailable right now.");
    } finally {
      setHistoryLoading(false);
      setHistoryRefreshing(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    const withdrawalAmount = Number(amount);
    if (
      !Number.isFinite(withdrawalAmount) ||
      withdrawalAmount < MIN_WITHDRAWAL_AMOUNT
    ) {
      setMessage(
        `Enter an amount of at least $${MIN_WITHDRAWAL_AMOUNT.toFixed(2)}.`,
      );
      return;
    }

    setWithdrawalDialogError("");
    setWithdrawalDialogOpen(true);
    setPayoutLoading(true);
    try {
      const response = await client.get("/user/payout-details");
      setSavedPayout(response.data);
    } catch {
      setSavedPayout(null);
      setWithdrawalDialogError("Payout details could not be loaded. Try again.");
    } finally {
      setPayoutLoading(false);
    }
  }

  async function confirmWithdrawal(event) {
    event.preventDefault();
    if (!savedPayout?.payoutMethod) {
      setWithdrawalDialogError("Add your payout details in Manage Payments first.");
      return;
    }

    setWithdrawalSubmitting(true);
    setWithdrawalDialogError("");
    try {
      await client.post("/withdrawals/request", { amount: Number(amount) });
      setMessage(
        "Withdrawal requested. It will be reviewed within a few business days.",
      );
      setAmount("");
      setWithdrawalDialogOpen(false);
      loadHistory();
    } catch (err) {
      setWithdrawalDialogError(
        err.response?.data?.error || "Request failed. Please try again.",
      );
    } finally {
      setWithdrawalSubmitting(false);
    }
  }

  function closeWithdrawalDialog() {
    if (withdrawalSubmitting) return;
    setWithdrawalDialogOpen(false);
    setWithdrawalDialogError("");
  }

  return (
    <main className="client-page withdrawals-page">
      <ClientPageHeader
        eyebrow="YOUR PAYOUTS"
        title="Withdraw"
        description="Request a payout when you're ready. Each request is reviewed before processing."
      />
      {message && (
        <div
          className={`client-feedback ${message.startsWith("Withdrawal requested") ? "is-success" : "is-error"}`}
          role="status"
        >
          {message}
        </div>
      )}

      {activeWithdrawalWindow && (
        <section
          className="client-section withdrawal-window"
          aria-label="Withdrawal countdown"
        >
          <div className="client-section-heading">
            <h2>Withdrawal window</h2>
            <span>{WITHDRAWAL_WINDOW_DAYS}-day rule</span>
          </div>

          <div className="withdrawal-countdown-card">
            <div className="withdrawal-countdown-main">
              <span>TIME LEFT</span>
              <strong className="withdrawal-countdown-value">
                {activeWithdrawalWindow.countdown.expired
                  ? "Expired"
                  : `${activeWithdrawalWindow.countdown.days}d ${activeWithdrawalWindow.countdown.hours}h ${activeWithdrawalWindow.countdown.minutes}m`}
              </strong>
              <small>Keep an eye on your review window.</small>
            </div>
            <div className="withdrawal-date-card">
              <span>EXPECTED DATE</span>
              <strong className="withdrawal-date-value">
                {activeWithdrawalWindow.deadline.toLocaleDateString()}
              </strong>
              <span className="withdrawal-date-icon" aria-hidden="true">
                ↗
              </span>
            </div>
          </div>
        </section>
      )}

      <form
        onSubmit={handleSubmit}
        className="withdraw-form withdrawal-request"
        noValidate
      >
        <div className="withdrawal-form-heading">
          <div>
            <span className="withdrawal-form-eyebrow">READY WHEN YOU ARE</span>
            <label htmlFor="withdraw-amount">Request a withdrawal</label>
          </div>
          <span className="withdrawal-form-mark" aria-hidden="true">
            $
          </span>
        </div>
        <p>
          Minimum withdrawal is $100.00. Requests are reviewed before payout.
        </p>
        <div className="withdraw-amount-field">
          <span aria-hidden="true">$</span>
          <input
            id="withdraw-amount"
            type="number"
            inputMode="decimal"
            min={MIN_WITHDRAWAL_AMOUNT}
            step="0.01"
            placeholder="100.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <button className="withdraw-submit" type="submit">
          Request withdrawal <span aria-hidden="true">→</span>
        </button>
      </form>

      <section className="withdrawal-guide" aria-label="How withdrawals work">
        <div className="withdrawal-guide-heading">
          <div>
            <span className="withdrawal-form-eyebrow">PAYOUT GUIDE</span>
            <h2>How it works</h2>
          </div>
          <span className="withdrawal-guide-status">CLEAR &amp; SIMPLE</span>
        </div>
        <div className="withdrawal-guide-steps">
          <article>
            <span>01</span>
            <strong>Choose an amount</strong>
            <p>Enter at least $100.00.</p>
          </article>
          <article>
            <span>02</span>
            <strong>We review it</strong>
            <p>Your request enters review.</p>
          </article>
          <article>
            <span>03</span>
            <strong>Track the window</strong>
            <p>See the expected payout date.</p>
          </article>
        </div>
      </section>

      <section className="client-section">
        <div className="client-section-heading">
          <h2>Requested withdrawal history</h2>
          <div className="wallet-history-controls">
            <span className="wallet-history-count">
              {history.length} {history.length === 1 ? "request" : "requests"}
            </span>
            <button
              className="wallet-history-refresh"
              type="button"
              onClick={loadHistory}
              disabled={historyLoading || historyRefreshing}
              aria-label="Refresh withdrawal history"
            >
              <FiRefreshCw
                className={historyRefreshing ? "is-refreshing" : ""}
                aria-hidden="true"
              />
              <span>{historyRefreshing ? "Refreshing" : "Refresh"}</span>
            </button>
          </div>
        </div>
        {historyError ? (
          <p className="client-empty compact" role="alert">
            {historyError}
          </p>
        ) : historyLoading ? (
          <p className="client-empty compact" role="status">
            Loading withdrawal history…
          </p>
        ) : history.length ? (
          <div className="wallet-list withdrawal-history-list">
            {history.map((withdrawal) => {
              const status = String(
                withdrawal.status || "REQUESTED",
              ).toUpperCase();
              const requestedDate = withdrawal.requestedAt
                ? new Date(withdrawal.requestedAt)
                : null;
              const isValidRequestedDate =
                requestedDate && !Number.isNaN(requestedDate.getTime());
              const amount = Number(withdrawal.amount || 0);
              const details = [
                ["Type", "Withdrawal request"],
                ["Status", status.replaceAll("_", " ")],
                ["Amount", `−$${amount.toFixed(2)}`],
                [
                  "Requested",
                  isValidRequestedDate
                    ? requestedDate.toLocaleString()
                    : "Date unavailable",
                ],
                [
                  "Expected payout",
                  isValidRequestedDate
                    ? getExpectedWithdrawalDate(
                        requestedDate,
                      ).toLocaleDateString()
                    : null,
                ],
                [
                  "Payout method",
                  withdrawal.payoutMethod === "BANK"
                    ? "Bank"
                    : withdrawal.payoutMethod === "UPI"
                      ? "UPI"
                      : null,
                ],
                ["Transaction reference", withdrawal.transactionRef],
                ["Remark", withdrawal.rejectionReason],
              ].filter(
                ([, value]) =>
                  value !== undefined && value !== null && value !== "",
              );
              const isRejected = status === "REJECTED";

              return (
                <article className="wallet-history-item" key={withdrawal._id}>
                  <button
                    className="wallet-row wallet-history-row wallet-history-trigger withdrawal-history-row"
                    type="button"
                    aria-expanded={expandedWithdrawalId === withdrawal._id}
                    aria-controls={`withdrawal-details-${withdrawal._id}`}
                    onClick={() =>
                      setExpandedWithdrawalId((current) =>
                        current === withdrawal._id ? null : withdrawal._id,
                      )
                    }
                  >
                    <span className="wallet-row-icon" aria-hidden="true">
                      ↗
                    </span>
                    <span className="wallet-row-copy wallet-history-copy">
                      <strong>Withdrawal</strong>
                      <time
                        dateTime={
                          isValidRequestedDate
                            ? requestedDate.toISOString()
                            : undefined
                        }
                      >
                        {isValidRequestedDate
                          ? requestedDate.toLocaleDateString()
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
                    <strong className="wallet-row-amount is-debit">
                      −${amount.toFixed(2)}
                    </strong>
                    <FiChevronDown
                      className="wallet-history-chevron"
                      aria-hidden="true"
                    />
                  </button>
                  {expandedWithdrawalId === withdrawal._id && (
                    <div
                      className="wallet-history-expanded"
                      id={`withdrawal-details-${withdrawal._id}`}
                    >
                      <dl className="wallet-history-fields">
                        {details.map(([label, value]) => (
                          <div
                            className={label === "Remark" ? "is-remark" : ""}
                            key={label}
                          >
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                      {isRejected && (
                        <Link className="wallet-history-help-link" to="/help">
                          Get help with this withdrawal
                          <FiArrowRight aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="client-empty compact">
            Your withdrawal requests will appear here.
          </p>
        )}
      </section>

      {withdrawalDialogOpen && (
        <div
          className="withdrawal-method-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeWithdrawalDialog();
          }}
        >
          <section
            className="withdrawal-method-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdrawal-method-title"
          >
            <header className="withdrawal-method-header">
              <div>
                <span className="withdrawal-form-eyebrow">PAYOUT METHOD</span>
                <h2 id="withdrawal-method-title">Confirm your payout</h2>
                <p>
                  Review where your ${Number(amount).toFixed(2)}{" "}
                  request will be sent.
                </p>
              </div>
              <button
                className="upi-dialog-close"
                type="button"
                onClick={closeWithdrawalDialog}
                disabled={withdrawalSubmitting}
                aria-label="Close payout method dialog"
              >
                <FiX aria-hidden="true" />
              </button>
            </header>
            <form onSubmit={confirmWithdrawal}>
              {payoutLoading && (
                <p className="withdrawal-method-note">Loading payout details…</p>
              )}
              {!payoutLoading && savedPayout?.payoutMethod && (
                <>
                  <p className="withdrawal-method-note">
                    Your payout will be sent to the method below. To change it,
                    update it in{" "}
                    <Link to="/payments">Manage Payments</Link>.
                  </p>
                  <PayoutSummary
                    method={savedPayout.payoutMethod}
                    details={savedPayout.payoutDetails}
                  />
                </>
              )}
              {!payoutLoading && !savedPayout?.payoutMethod && (
                <p className="withdrawal-method-note">
                  You haven't added payout details yet.{" "}
                  <Link to="/payments">Add them in Manage Payments</Link> to
                  continue.
                </p>
              )}
              {withdrawalDialogError && (
                <p className="withdrawal-method-error" role="alert">
                  {withdrawalDialogError}
                </p>
              )}
              <div className="withdrawal-method-actions">
                <button
                  className="wallet-history-refresh"
                  type="button"
                  onClick={closeWithdrawalDialog}
                  disabled={withdrawalSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="withdrawal-method-confirm"
                  type="submit"
                  disabled={
                    payoutLoading ||
                    !savedPayout?.payoutMethod ||
                    withdrawalSubmitting
                  }
                >
                  {withdrawalSubmitting ? "Submitting..." : "Confirm request"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
