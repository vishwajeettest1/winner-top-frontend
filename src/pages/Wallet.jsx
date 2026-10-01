import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiCreditCard,
  FiSmartphone,
} from "react-icons/fi";
import client from "../api/client";
import ClientPageHeader from "../components/ClientPageHeader.jsx";

const FIXED_STARTER_AMOUNT = 25;
const MIN_ADD_MONEY_AMOUNT = 25;
const initialReferralRewards = [
  {
    _id: "ref-demo-1",
    name: "Aisha",
    status: "Active",
    amount: 12.5,
    date: "2026-09-25",
  },
  {
    _id: "ref-demo-2",
    name: "Milan",
    status: "Pending",
    amount: 8.0,
    date: "2026-09-28",
  },
];

export default function Wallet() {
  const location = useLocation();
  const [wallet, setWallet] = useState(null);
  const [txns, setTxns] = useState({ videoRewards: [], withdrawals: [] });
  const [depositAmount, setDepositAmount] = useState(() =>
    location.state?.starterAmount ? String(location.state.starterAmount) : "",
  );
  const [depositMethod, setDepositMethod] = useState("upi");
  const [depositMessage, setDepositMessage] = useState("");
  const [depositError, setDepositError] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [referralRewards, setReferralRewards] = useState(() => {
    const saved = localStorage.getItem("streamearn_referral_rewards");
    if (!saved) return initialReferralRewards;
    try {
      return JSON.parse(saved);
    } catch {
      return initialReferralRewards;
    }
  });

  useEffect(() => {
    const refreshWallet = () => {
      client.get("/wallet/balance").then((res) => setWallet(res.data.wallet));
      client.get("/wallet/transactions").then((res) => setTxns(res.data));
    };

    refreshWallet();
    window.addEventListener("wallet:updated", refreshWallet);

    return () => window.removeEventListener("wallet:updated", refreshWallet);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "streamearn_referral_rewards",
      JSON.stringify(referralRewards),
    );
  }, [referralRewards]);

  function prepareStarterPayment() {
    setDepositAmount(String(FIXED_STARTER_AMOUNT));
    setDepositMethod("upi");
    setDepositError(false);
    setDepositMessage(
      "Starter activation amount selected. Continue to payment.",
    );
    document.getElementById("add-money-amount")?.focus();
  }

  async function handleAddMoney(event) {
    event.preventDefault();
    setDepositMessage("");
    setDepositError(false);
    const amount = Number(depositAmount);

    if (!Number.isFinite(amount) || amount < MIN_ADD_MONEY_AMOUNT) {
      setDepositError(true);
      setDepositMessage(
        `Enter an amount of at least $${MIN_ADD_MONEY_AMOUNT.toFixed(2)}.`,
      );
      return;
    }

    setDepositLoading(true);
    try {
      const response = await client.post("/payments/create-order", {
        amount,
        method: depositMethod,
      });
      const checkoutUrl =
        response.data?.checkoutUrl || response.data?.paymentUrl;

      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }

      setDepositMessage(
        "Payment order created. Complete payment to update your wallet.",
      );
    } catch (error) {
      setDepositError(true);
      setDepositMessage(
        error.response?.data?.error ||
          "Payment service is not connected yet. Add the payment backend to continue.",
      );
    } finally {
      setDepositLoading(false);
    }
  }

  const starterActive = Boolean(
    wallet?.starterPlanActive || wallet?.starterActivatedAt,
  );
  const totalBalance = Number(wallet?.totalBalance || 0);

  return (
    <main className="client-page">
      <ClientPageHeader
        eyebrow="YOUR EARNINGS"
        title="Wallet"
        description="Track your rewards and payout activity in one place."
      />
      <section className="wallet-total" aria-label="Available balance">
        <span>AVAILABLE BALANCE</span>
        <strong>${totalBalance.toFixed(2)}</strong>
      </section>

      <form className="wallet-add-money" onSubmit={handleAddMoney} noValidate>
        <div className="wallet-add-money-heading">
          <div>
            <span className="wallet-add-money-eyebrow">FUND YOUR WALLET</span>
            <h2>Add money</h2>
            <p>Pay securely with UPI or your bank account.</p>
          </div>
          <FiCheckCircle aria-hidden="true" />
        </div>
        <label htmlFor="add-money-amount">Amount</label>
        <div className="wallet-add-money-input">
          <span aria-hidden="true">$</span>
          <input
            id="add-money-amount"
            type="number"
            min={MIN_ADD_MONEY_AMOUNT}
            step="0.01"
            inputMode="decimal"
            placeholder="25.00"
            value={depositAmount}
            onChange={(event) => setDepositAmount(event.target.value)}
            required
          />
        </div>
        <fieldset className="wallet-payment-methods">
          <legend>Payment method</legend>
          <label className={depositMethod === "upi" ? "is-selected" : ""}>
            <input
              type="radio"
              name="payment-method"
              value="upi"
              checked={depositMethod === "upi"}
              onChange={(event) => setDepositMethod(event.target.value)}
            />
            <FiSmartphone aria-hidden="true" />
            <span>
              <strong>UPI</strong>
              <small>Instant payment</small>
            </span>
          </label>
          <label className={depositMethod === "bank" ? "is-selected" : ""}>
            <input
              type="radio"
              name="payment-method"
              value="bank"
              checked={depositMethod === "bank"}
              onChange={(event) => setDepositMethod(event.target.value)}
            />
            <FiCreditCard aria-hidden="true" />
            <span>
              <strong>Bank account</strong>
              <small>Net banking checkout</small>
            </span>
          </label>
        </fieldset>
        <button
          className="wallet-add-money-submit"
          type="submit"
          disabled={depositLoading}
        >
          {depositLoading ? "Opening payment…" : "Continue to payment"}
          <FiArrowRight aria-hidden="true" />
        </button>
        {depositMessage && (
          <p
            className={`wallet-add-money-message ${depositError ? "is-error" : ""}`}
            role={depositError ? "alert" : "status"}
          >
            {depositMessage}
          </p>
        )}
        <small className="wallet-add-money-note">
          Your wallet is credited only after the payment gateway confirms the
          transaction.
        </small>
      </form>

      <section className="client-section">
        <div className="client-section-heading">
          <h2>Starter plan</h2>
          <span>{starterActive ? "ACTIVE" : "INACTIVE"}</span>
        </div>

        {starterActive ? (
          <div className="wallet-list">
            <article className="wallet-row" key="starter-plan">
              <span className="wallet-row-icon" aria-hidden="true">
                ✓
              </span>
              <div className="wallet-row-copy">
                <strong>Fixed start amount</strong>
                <time dateTime={new Date().toISOString()}>
                  {new Date().toLocaleDateString()}
                </time>
              </div>
              <span className="wallet-row-status">ACTIVE</span>
              <strong className="wallet-row-amount">
                +${FIXED_STARTER_AMOUNT.toFixed(2)}
              </strong>
            </article>
          </div>
        ) : (
          <button
            type="button"
            className="register-submit"
            onClick={prepareStarterPayment}
            style={{ marginTop: 12 }}
          >
            <span className="register-submit-label">
              Add ${FIXED_STARTER_AMOUNT.toFixed(2)} to activate starter plan
            </span>
          </button>
        )}
      </section>

      <section className="client-section">
        <div className="client-section-heading">
          <h2>Video rewards</h2>
          <span>{txns.videoRewards.length} entries</span>
        </div>
        {txns.videoRewards.length ? (
          <div className="wallet-list">
            {txns.videoRewards.map((transaction) => (
              <article className="wallet-row" key={transaction._id}>
                <span className="wallet-row-icon" aria-hidden="true">
                  ▶
                </span>
                <div className="wallet-row-copy">
                  <strong>
                    {transaction.sourceType === "sponsored"
                      ? "Sponsored video"
                      : "Ad network video"}
                  </strong>
                  <time dateTime={transaction.watchedAt}>
                    {new Date(transaction.watchedAt).toLocaleDateString()}
                  </time>
                </div>
                <strong className="wallet-row-amount">
                  +${transaction.rewardCredited.toFixed(4)}
                </strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="client-empty compact">
            Your video rewards will appear here.
          </p>
        )}
      </section>

      <section className="client-section">
        <div className="client-section-heading">
          <h2>Referral rewards</h2>
          <span>{referralRewards.length} payouts</span>
        </div>
        {referralRewards.length ? (
          <div className="wallet-list">
            {referralRewards.map((reward) => (
              <article className="wallet-row" key={reward._id}>
                <span className="wallet-row-icon" aria-hidden="true">
                  +
                </span>
                <div className="wallet-row-copy">
                  <strong>{reward.name}</strong>
                  <time dateTime={reward.date}>
                    {new Date(reward.date).toLocaleDateString()}
                  </time>
                </div>
                <span className="wallet-row-status">{reward.status}</span>
                <strong className="wallet-row-amount">
                  +${Number(reward.amount).toFixed(2)}
                </strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="client-empty compact">
            Your referral rewards will appear here.
          </p>
        )}
      </section>

      <section className="client-section">
        <div className="client-section-heading">
          <h2>Withdrawals</h2>
          <span>{txns.withdrawals.length} requests</span>
        </div>
        {txns.withdrawals.length ? (
          <div className="wallet-list">
            {txns.withdrawals.map((withdrawal) => (
              <article className="wallet-row" key={withdrawal._id}>
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
                  -${withdrawal.amount.toFixed(2)}
                </strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="client-empty compact">
            You haven't requested a withdrawal yet.
          </p>
        )}
      </section>
    </main>
  );
}
