import React, { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import ClientPageHeader from "../components/ClientPageHeader.jsx";

const WITHDRAWAL_WINDOW_DAYS = 7;
const MIN_WITHDRAWAL_AMOUNT = 50;

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

export default function Withdrawals() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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

  function loadHistory() {
    client
      .get("/withdrawals/history")
      .then((res) => setHistory(res.data.withdrawals));
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

    try {
      await client.post("/withdrawals/request", { amount: withdrawalAmount });
      setMessage(
        "Withdrawal requested. It will be reviewed within a few business days.",
      );
      setAmount("");
      loadHistory();
    } catch (err) {
      setMessage(err.response?.data?.error || "Request failed");
    }
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
            <p>Enter at least $50.00.</p>
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
          Minimum withdrawal is $50.00. Requests are reviewed before payout.
        </p>
        <div className="withdraw-amount-field">
          <span aria-hidden="true">$</span>
          <input
            id="withdraw-amount"
            type="number"
            inputMode="decimal"
            min={MIN_WITHDRAWAL_AMOUNT}
            step="0.01"
            placeholder="50.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <button className="withdraw-submit" type="submit">
          Request withdrawal <span aria-hidden="true">→</span>
        </button>
      </form>

      <section className="client-section">
        <div className="client-section-heading">
          <h2>Request history</h2>
          <span>{history.length} requests</span>
        </div>
        {history.length ? (
          <div className="wallet-list withdrawal-history-list">
            {history.map((withdrawal) => (
              <article
                className="wallet-row withdrawal-history-row"
                key={withdrawal._id}
              >
                <span className="wallet-row-icon" aria-hidden="true">
                  ↗
                </span>
                <div className="wallet-row-copy">
                  <strong>Withdrawal request</strong>
                  <time dateTime={withdrawal.requestedAt}>
                    {new Date(withdrawal.requestedAt).toLocaleDateString()}
                  </time>
                </div>
                <span className="wallet-row-status">{withdrawal.status}</span>
                <strong className="wallet-row-amount">
                  ${withdrawal.amount.toFixed(2)}
                </strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="client-empty compact">
            Your withdrawal requests will appear here.
          </p>
        )}
      </section>
    </main>
  );
}
