import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiCreditCard,
  FiCopy,
  FiChevronDown,
  FiPlus,
  FiRefreshCw,
  FiX,
  FiSmartphone,
} from "react-icons/fi";
import client from "../api/client";
import {
  getLocalActiveDepositOption,
  isMissingPaymentApi,
} from "../api/depositLocalStore.js";
import ClientPageHeader from "../components/ClientPageHeader.jsx";

const FIXED_STARTER_AMOUNT = 25;
const MIN_ADD_MONEY_AMOUNT = 25;
const transactionGroups = [
  { key: "deposits", title: "Deposit", icon: "$", defaultStatus: "Recorded" },
];

function getTransactionDate(transaction) {
  const value =
    transaction.createdAt ||
    transaction.timestamp ||
    transaction.watchedAt ||
    transaction.requestedAt ||
    transaction.paidAt ||
    transaction.joinedAt ||
    transaction.date;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function buildWalletHistory(data) {
  return transactionGroups
    .flatMap((group) =>
      (Array.isArray(data?.[group.key]) ? data[group.key] : []).map(
        (transaction, index) => {
          const date = getTransactionDate(transaction);
          const amount = Number(
            transaction.amount ?? transaction.rewardCredited ?? 0,
          );
          const title = group.title;
          const detailValues = [
            ["Type", title],
            [
              "Status",
              (transaction.status || group.defaultStatus).replaceAll("_", " "),
            ],
            ["Amount", `+$${Math.abs(amount).toFixed(2)}`],
            ["Date", date?.toLocaleString()],
            [
              "Reference",
              transaction.referenceId ||
                transaction.transactionId ||
                transaction.utrNumber,
            ],
            ["Payment method", transaction.paymentMethod || transaction.method],
            ["Purpose", transaction.purpose],
            [
              "Source",
              typeof transaction.source === "string"
                ? transaction.source
                : transaction.sourceType,
            ],
            ["Remark", transaction.rejectionReason || transaction.remark],
          ];

          return {
            id: transaction._id || transaction.id || `${group.key}-${index}`,
            title,
            icon: group.icon,
            status: transaction.status || group.defaultStatus,
            isRejected:
              String(transaction.status || "").toUpperCase() === "REJECTED",
            remark: transaction.rejectionReason || transaction.remark || "",
            details: detailValues.filter(
              ([, value]) =>
                value !== undefined && value !== null && value !== "",
            ),
            date,
            amount: `+$${Math.abs(amount).toFixed(2)}`,
            sortTime: date?.getTime() || 0,
          };
        },
      ),
    )
    .sort((first, second) => second.sortTime - first.sortTime);
}

export default function Wallet() {
  const location = useLocation();
  const [wallet, setWallet] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [depositAmount, setDepositAmount] = useState(() =>
    location.state?.starterAmount ? String(location.state.starterAmount) : "",
  );
  const [paymentPurpose, setPaymentPurpose] = useState(() =>
    location.state?.starterAmount ? "STARTER_PLAN" : "WALLET_TOPUP",
  );
  const [depositMethod, setDepositMethod] = useState("upi");
  const [depositMessage, setDepositMessage] = useState("");
  const [depositError, setDepositError] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [upiOption, setUpiOption] = useState(null);
  const [upiDialogOpen, setUpiDialogOpen] = useState(false);
  const [qrZoomOpen, setQrZoomOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [proofError, setProofError] = useState("");
  const [proofMessage, setProofMessage] = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);

  useEffect(() => {
    if (!paymentScreenshot) {
      setScreenshotPreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(paymentScreenshot);
    setScreenshotPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [paymentScreenshot]);

  useEffect(() => {
    if (!upiDialogOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !proofSubmitting) {
        if (qrZoomOpen) {
          setQrZoomOpen(false);
        } else {
          setUpiDialogOpen(false);
        }
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [upiDialogOpen, proofSubmitting, qrZoomOpen]);

  async function refreshHistory() {
    setHistoryRefreshing(true);
    try {
      const response = await client.get("/wallet/transactions");
      setHistory(buildWalletHistory(response.data));
      setHistoryError("");
    } catch {
      setHistoryError("Wallet history is unavailable right now.");
    } finally {
      setHistoryLoading(false);
      setHistoryRefreshing(false);
    }
  }

  useEffect(() => {
    const refreshWallet = () => {
      client.get("/wallet/balance").then((res) => setWallet(res.data.wallet));
      refreshHistory();
    };

    refreshWallet();
    window.addEventListener("wallet:updated", refreshWallet);

    return () => window.removeEventListener("wallet:updated", refreshWallet);
  }, []);

  function prepareStarterPayment() {
    setDepositAmount(String(FIXED_STARTER_AMOUNT));
    setDepositMethod("upi");
    setPaymentPurpose("STARTER_PLAN");
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

    if (depositMethod === "upi") {
      setDepositLoading(true);
      try {
        let option;
        try {
          const response = await client.get("/deposit-options/active");
          option = response.data?.option;
        } catch (requestError) {
          if (!isMissingPaymentApi(requestError)) throw requestError;
          option = await getLocalActiveDepositOption();
        }

        if (!option) {
          option = await getLocalActiveDepositOption();
        }
        if (!option?.upiId || !option?.qrCodeUrl) {
          throw new Error(
            "No active UPI QR is configured. Ask the admin to upload and activate a QR in Deposits.",
          );
        }
        setUpiOption(option);
        setQrZoomOpen(false);
        setPaymentAmount(amount.toFixed(2));
        setUtrNumber("");
        setPaymentScreenshot(null);
        setProofError("");
        setProofMessage("");
        setUpiDialogOpen(true);
      } catch (error) {
        setDepositError(true);
        setDepositMessage(
          error.response?.data?.error ||
            error.message ||
            "Could not load the active UPI payment option.",
        );
      } finally {
        setDepositLoading(false);
      }
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

  async function copyUpiId() {
    try {
      await navigator.clipboard.writeText(upiOption.upiId);
      setProofMessage("UPI ID copied.");
    } catch {
      setProofMessage("Copy unavailable. Select the UPI ID to copy it.");
    }
  }

  async function handleSubmitPaymentProof(event) {
    event.preventDefault();
    setProofError("");
    setProofMessage("");
    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount < MIN_ADD_MONEY_AMOUNT) {
      setProofError(
        `Enter an amount of at least $${MIN_ADD_MONEY_AMOUNT.toFixed(2)}.`,
      );
      return;
    }
    if (utrNumber.trim().length < 6) {
      setProofError("Enter a valid UTR or transaction reference number.");
      return;
    }
    if (
      !paymentScreenshot ||
      !["image/png", "image/jpeg", "image/webp"].includes(
        paymentScreenshot.type,
      )
    ) {
      setProofError("Upload a PNG, JPEG, or WebP payment screenshot.");
      return;
    }
    if (paymentScreenshot.size > 5 * 1024 * 1024) {
      setProofError("Payment screenshot must be 5 MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("depositOptionId", upiOption.id || upiOption._id);
    formData.append("amount", amount.toFixed(2));
    formData.append("utrNumber", utrNumber.trim());
    formData.append("purpose", paymentPurpose);
    formData.append("paymentScreenshot", paymentScreenshot);

    setProofSubmitting(true);
    try {
      await client.post("/payments/submit-proof", formData);
      setUpiDialogOpen(false);
      setQrZoomOpen(false);
      setPaymentScreenshot(null);
      setDepositError(false);
      setDepositMessage(
        "Payment submitted for approval. Your wallet will be credited after verification.",
      );
      refreshHistory();
    } catch (error) {
      setProofError(
        error.response?.data?.error ||
          "Could not submit payment proof. Please try again.",
      );
    } finally {
      setProofSubmitting(false);
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
        description="Manage your balance, deposits, and recent activity."
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
          {depositLoading
            ? depositMethod === "upi"
              ? "Loading UPI QR…"
              : "Opening payment…"
            : "Continue to payment"}
          <span aria-hidden="true">→</span>
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
          Available balance will be updated once the payment transactions are
          confirmed.
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
            <span aria-hidden="true">
              <FiPlus />
            </span>
          </button>
        )}
      </section>

      <section className="client-section wallet-history-section">
        <div className="client-section-heading">
          <div className="wallet-history-title">
            <h2>Wallet deposit history</h2>
          </div>
          <div className="wallet-history-controls">
            <span className="wallet-history-count">
              {history.length} {history.length === 1 ? "deposit" : "deposits"}
            </span>
            <button
              className="wallet-history-refresh"
              type="button"
              onClick={refreshHistory}
              disabled={historyLoading || historyRefreshing}
              aria-label="Refresh wallet history"
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
          <p className="client-empty compact" role="status">
            {historyError}
          </p>
        ) : historyLoading ? (
          <p className="client-empty compact" role="status">
            Loading wallet history…
          </p>
        ) : history.length ? (
          <div className="wallet-list">
            {history.map((transaction) => (
              <article className="wallet-history-item" key={transaction.id}>
                <button
                  className="wallet-row wallet-history-row wallet-history-trigger"
                  type="button"
                  aria-expanded={expandedHistoryId === transaction.id}
                  aria-controls={`wallet-transaction-details-${transaction.id}`}
                  onClick={() =>
                    setExpandedHistoryId((current) =>
                      current === transaction.id ? null : transaction.id,
                    )
                  }
                >
                  <span className="wallet-row-icon" aria-hidden="true">
                    {transaction.icon}
                  </span>
                  <span className="wallet-row-copy wallet-history-copy">
                    <strong>{transaction.title}</strong>
                    <time dateTime={transaction.date?.toISOString()}>
                      {transaction.date?.toLocaleDateString() ||
                        "Date unavailable"}
                    </time>
                  </span>
                  <span className="wallet-history-details">
                    <span
                      className={`wallet-row-status wallet-history-status status-${transaction.status.toLowerCase().replaceAll("_", "-")}`}
                    >
                      {transaction.status.replaceAll("_", " ")}
                    </span>
                  </span>
                  <strong
                    className={`wallet-row-amount${transaction.isDebit ? " is-debit" : ""}`}
                  >
                    {transaction.amount}
                  </strong>
                  <FiChevronDown
                    className="wallet-history-chevron"
                    aria-hidden="true"
                  />
                </button>
                {expandedHistoryId === transaction.id && (
                  <div
                    className="wallet-history-expanded"
                    id={`wallet-transaction-details-${transaction.id}`}
                  >
                    <dl className="wallet-history-fields">
                      {transaction.details.map(([label, value]) => (
                        <div
                          className={label === "Remark" ? "is-remark" : ""}
                          key={label}
                        >
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                    {transaction.isRejected && (
                      <Link className="wallet-history-help-link" to="/help">
                        Get help with this transaction
                        <FiArrowRight aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="client-empty compact">
            Your wallet transactions will appear here.
          </p>
        )}
      </section>

      {upiDialogOpen && upiOption && (
        <div
          className="upi-payment-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !proofSubmitting) {
              setQrZoomOpen(false);
              setUpiDialogOpen(false);
            }
          }}
        >
          <section
            className="upi-payment-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upi-payment-title"
          >
            <header className="upi-payment-dialog-header">
              <div>
                <span className="wallet-add-money-eyebrow">UPI PAYMENT</span>
                <h2 id="upi-payment-title">Scan &amp; pay</h2>
                <p>Pay using any UPI app, then submit your payment details.</p>
              </div>
              <button
                className="upi-dialog-close"
                type="button"
                onClick={() => {
                  setQrZoomOpen(false);
                  setUpiDialogOpen(false);
                }}
                disabled={proofSubmitting}
                aria-label="Close payment dialog"
              >
                <FiX aria-hidden="true" />
              </button>
            </header>

            <div className="upi-payment-body">
              <div className="upi-payment-qr-panel">
                <button
                  className="upi-payment-qr-frame"
                  type="button"
                  onClick={() => setQrZoomOpen(true)}
                  aria-label="Enlarge UPI QR code"
                  aria-haspopup="dialog"
                >
                  <img src={upiOption.qrCodeUrl} alt="UPI payment QR code" />
                </button>
                <span className="upi-payment-option-name">
                  {upiOption.displayName || "UPI payment"}
                </span>
                <div className="upi-id-copy-row">
                  <span>{upiOption.upiId}</span>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    aria-label="Copy UPI ID"
                  >
                    <FiCopy aria-hidden="true" />
                  </button>
                </div>
                {proofMessage && (
                  <p className="upi-proof-note" role="status">
                    {proofMessage}
                  </p>
                )}
              </div>

              <form
                className="upi-proof-form"
                onSubmit={handleSubmitPaymentProof}
              >
                <label className="upi-proof-field">
                  <span>Amount paid</span>
                  <div className="upi-proof-amount">
                    <span>$</span>
                    <input
                      type="number"
                      min={MIN_ADD_MONEY_AMOUNT}
                      step="0.01"
                      inputMode="decimal"
                      value={paymentAmount}
                      disabled
                      required
                    />
                  </div>
                </label>
                <label className="upi-proof-field">
                  <span>
                    UTR / transaction reference{" "}
                    <span className="upi-required-marker" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(event) => setUtrNumber(event.target.value)}
                    minLength={6}
                    maxLength={50}
                    autoComplete="off"
                    placeholder="Enter your UTR number"
                    required
                  />
                </label>
                <label className="upi-proof-field">
                  <span>
                    Payment screenshot{" "}
                    <span className="upi-required-marker" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <input
                    className="upi-screenshot-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) =>
                      setPaymentScreenshot(event.target.files?.[0] || null)
                    }
                    required
                  />
                  <small>PNG, JPEG, or WebP · Maximum 5 MB</small>
                </label>
                {screenshotPreview && (
                  <div className="upi-screenshot-preview">
                    <img
                      src={screenshotPreview}
                      alt="Payment screenshot preview"
                    />
                    <span>{paymentScreenshot.name}</span>
                  </div>
                )}
                {proofError && (
                  <p className="upi-proof-error" role="alert">
                    {proofError}
                  </p>
                )}
                <button
                  className="wallet-add-money-submit upi-proof-submit"
                  type="submit"
                  disabled={proofSubmitting}
                >
                  {proofSubmitting
                    ? "Submitting for review…"
                    : "Submit for approval"}
                  <span aria-hidden="true">→</span>
                </button>
                <p className="upi-proof-disclaimer">
                  Your balance is updated only after the payment is verified and
                  approved.
                </p>
              </form>
            </div>
          </section>
        </div>
      )}
      {qrZoomOpen && upiDialogOpen && upiOption && (
        <div
          className="upi-qr-zoom-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setQrZoomOpen(false);
          }}
        >
          <div
            className="upi-qr-zoom-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Enlarged UPI payment QR code"
          >
            <button
              className="upi-dialog-close upi-qr-zoom-close"
              type="button"
              onClick={() => setQrZoomOpen(false)}
              aria-label="Close enlarged QR code"
            >
              <FiX aria-hidden="true" />
            </button>
            <img src={upiOption.qrCodeUrl} alt="Enlarged UPI payment QR code" />
          </div>
        </div>
      )}
    </main>
  );
}
