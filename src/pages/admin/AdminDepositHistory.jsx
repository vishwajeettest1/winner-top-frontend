import React, { useEffect, useRef, useState } from "react";
import { FiExternalLink, FiRefreshCw } from "react-icons/fi";
import client from "../../api/client";

const terminalStatuses = new Set(["APPROVED", "REJECTED", "CANCELLED"]);

function getPaymentTimestamp(payment) {
  const timestamp = new Date(
    payment.createdAt || payment.submittedAt || 0,
  ).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function AdminDepositHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [loadingProofId, setLoadingProofId] = useState(null);
  const [proofPreviews, setProofPreviews] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rejectingPayment, setRejectingPayment] = useState(null);
  const [rejectionRemark, setRejectionRemark] = useState("");
  const [filters, setFilters] = useState({
    user: "",
    mobile: "",
    purpose: "",
    submittedOn: "",
    status: "",
    actions: "",
  });
  const previewUrls = useRef(new Set());

  useEffect(
    () => () => {
      for (const previewUrl of previewUrls.current) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [],
  );

  async function loadHistory() {
    setLoading(true);
    setError("");
    try {
      const response = await client.get("/admin/payments", {
        params: { status: "ALL" },
      });
      setPayments(
        (response.data.payments || []).sort(
          (first, second) =>
            getPaymentTimestamp(second) - getPaymentTimestamp(first),
        ),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Could not load MongoDB deposit history. Check the API connection and retry.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function updatePayment(payment, action, remark = "") {
    const paymentId = payment._id || payment.id;
    setUpdatingId(paymentId);
    setError("");
    setMessage("");

    try {
      const successMessages = {
        APPROVE: "Deposit approved and wallet credited.",
        REJECT: "Deposit rejected. The reason was saved to its history record.",
      };
      await client.patch(`/admin/payments/${paymentId}`, {
        action,
        rejectionReason: remark.trim(),
      });
      setMessage(successMessages[action]);
      if (action === "REJECT") {
        setRejectingPayment(null);
        setRejectionRemark("");
      }
      await loadHistory();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Could not update this deposit record.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function openRejectDialog(payment) {
    setError("");
    setRejectionRemark("");
    setRejectingPayment(payment);
  }

  function closeRejectDialog() {
    if (updatingId) return;
    setRejectingPayment(null);
    setRejectionRemark("");
  }

  function submitRejection(event) {
    event.preventDefault();
    if (!rejectionRemark.trim()) {
      setError("Enter a remark before rejecting this deposit.");
      return;
    }
    updatePayment(rejectingPayment, "REJECT", rejectionRemark);
  }

  const filteredPayments = payments.filter((payment) => {
    const email = String(
      payment.user?.email || payment.userId?.email || "",
    ).toLowerCase();
    const mobile = String(
      payment.user?.mobileNumber || payment.userId?.mobileNumber || "",
    ).toLowerCase();
    const purpose =
      payment.purpose === "STARTER_PLAN" ? "STARTER_PLAN" : "WALLET_TOPUP";
    const status = String(payment.status || "PENDING_REVIEW").toUpperCase();
    const submittedAt = payment.createdAt || payment.submittedAt;
    const submittedDate = submittedAt ? new Date(submittedAt) : null;
    const localDate =
      submittedDate && !Number.isNaN(submittedDate.getTime())
        ? `${submittedDate.getFullYear()}-${String(submittedDate.getMonth() + 1).padStart(2, "0")}-${String(submittedDate.getDate()).padStart(2, "0")}`
        : "";
    const needsAction = !terminalStatuses.has(status);

    return (
      email.includes(filters.user.trim().toLowerCase()) &&
      mobile.includes(filters.mobile.trim().toLowerCase()) &&
      (!filters.purpose || purpose === filters.purpose) &&
      (!filters.submittedOn || localDate === filters.submittedOn) &&
      (!filters.status || status === filters.status) &&
      (!filters.actions ||
        (filters.actions === "NEEDS_ACTION" && needsAction) ||
        (filters.actions === "REVIEWED" && !needsAction))
    );
  });
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function loadProofPreview(payment) {
    const paymentId = payment._id || payment.id;
    if (proofPreviews[paymentId]) return;
    setLoadingProofId(paymentId);
    setError("");
    try {
      let previewUrl = payment.screenshotUrl;
      if (!previewUrl) {
        const response = await client.get(
          `/admin/payments/${paymentId}/screenshot`,
          { responseType: "blob" },
        );
        previewUrl = URL.createObjectURL(response.data);
        previewUrls.current.add(previewUrl);
      }
      setProofPreviews((current) => ({ ...current, [paymentId]: previewUrl }));
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Could not load this payment screenshot.",
      );
    } finally {
      setLoadingProofId(null);
    }
  }

  return (
    <div className="container admin-table-page admin-deposit-history-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">DEPOSIT RECORDS</p>
          <h2>Wallet deposit history</h2>
          <p>Review submitted UPI payments and their approval status.</p>
        </div>
        <div className="admin-payment-heading-actions">
          <span className="admin-count">
            {filteredPayments.length === payments.length
              ? `${payments.length} deposits`
              : `${filteredPayments.length} of ${payments.length} deposits`}
          </span>
          <button
            className="admin-refresh"
            type="button"
            onClick={loadHistory}
            disabled={loading}
          >
            <FiRefreshCw aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-notice admin-notice-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="admin-notice admin-notice-success" role="status">
          {message}
        </div>
      )}
      <div
        className="admin-deposit-filters"
        aria-label="Filter deposit history"
      >
        <div className="admin-deposit-filter-fields">
          <label className="admin-field">
            <span>User</span>
            <input
              type="search"
              value={filters.user}
              onChange={(event) => updateFilter("user", event.target.value)}
              placeholder="Search email"
            />
          </label>
          <label className="admin-field">
            <span>Mobile No</span>
            <input
              type="search"
              inputMode="tel"
              value={filters.mobile}
              onChange={(event) => updateFilter("mobile", event.target.value)}
              placeholder="Search mobile number"
            />
          </label>
          <label className="admin-field">
            <span>Purpose</span>
            <select
              value={filters.purpose}
              onChange={(event) => updateFilter("purpose", event.target.value)}
            >
              <option value="">All purposes</option>
              <option value="WALLET_TOPUP">Wallet top-up</option>
              <option value="STARTER_PLAN">Starter plan</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Submitted on</span>
            <input
              type="date"
              value={filters.submittedOn}
              onClick={(event) => {
                if (typeof event.currentTarget.showPicker === "function") {
                  event.currentTarget.showPicker();
                }
              }}
              onChange={(event) =>
                updateFilter("submittedOn", event.target.value)
              }
            />
          </label>
          <label className="admin-field">
            <span>Status</span>
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="PENDING_REVIEW">Pending review</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Actions</span>
            <select
              value={filters.actions}
              onChange={(event) => updateFilter("actions", event.target.value)}
            >
              <option value="">All records</option>
              <option value="NEEDS_ACTION">Needs review</option>
              <option value="REVIEWED">Already reviewed</option>
            </select>
          </label>
          <div className="admin-deposit-filter-actions">
            <span>
              {filteredPayments.length} matching{" "}
              {filteredPayments.length === 1 ? "record" : "records"}
            </span>
            <span className="admin-deposit-active-filters">
              {activeFilterCount} active{" "}
              {activeFilterCount === 1 ? "filter" : "filters"}
            </span>
            <button
              className="admin-filter-reset"
              type="button"
              onClick={() =>
                setFilters({
                  user: "",
                  mobile: "",
                  purpose: "",
                  submittedOn: "",
                  status: "",
                  actions: "",
                })
              }
              disabled={activeFilterCount === 0}
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>
      <div className="admin-table-scroll">
        <table className="admin-data-table admin-deposit-history-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Purpose</th>
              <th>UTR / reference</th>
              <th>Submitted</th>
              <th>Screenshot</th>
              <th>Status</th>
              <th>Admin remark</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="admin-table-empty">
                  Loading deposit history...
                </td>
              </tr>
            ) : filteredPayments.length ? (
              filteredPayments.map((payment) => {
                const paymentId = payment._id || payment.id;
                const submittedAt = payment.createdAt || payment.submittedAt;
                const status = String(
                  payment.status || "PENDING_REVIEW",
                ).toUpperCase();
                const isTerminal = terminalStatuses.has(status);
                return (
                  <tr key={paymentId}>
                    <td>
                      <span>
                        {payment.user?.email ||
                          payment.userId?.email ||
                          "Local demo"}
                      </span>
                      {(payment.user?.mobileNumber ||
                        payment.userId?.mobileNumber) && (
                        <small className="admin-deposit-user-mobile">
                          {payment.user?.mobileNumber ||
                            payment.userId?.mobileNumber}
                        </small>
                      )}
                    </td>
                    <td className="admin-money-cell">
                      $
                      {Number(payment.amount ?? payment.amountUsd ?? 0).toFixed(
                        2,
                      )}
                    </td>
                    <td>
                      {payment.purpose === "STARTER_PLAN"
                        ? "Starter plan"
                        : "Wallet top-up"}
                    </td>
                    <td>{payment.utrNumber || "—"}</td>
                    <td>
                      {submittedAt
                        ? new Date(submittedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      {proofPreviews[paymentId] ? (
                        <a
                          className="admin-payment-proof-link"
                          href={proofPreviews[paymentId]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            className="admin-payment-proof-thumb"
                            src={proofPreviews[paymentId]}
                            alt="Payment screenshot"
                          />
                          Open <FiExternalLink aria-hidden="true" />
                        </a>
                      ) : (
                        <button
                          className="admin-payment-proof-link admin-proof-load"
                          type="button"
                          onClick={() => loadProofPreview(payment)}
                          disabled={loadingProofId === paymentId}
                        >
                          {loadingProofId === paymentId
                            ? "Loading..."
                            : "View proof"}
                        </button>
                      )}
                    </td>
                    <td>
                      <span
                        className={`admin-status ${status === "APPROVED" ? "status-active" : status === "PENDING_REVIEW" || status === "UNDER_REVIEW" ? "status-review" : "status-blocked"}`}
                      >
                        {status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>{payment.rejectionReason || "—"}</td>
                    <td>
                      {isTerminal ? (
                        <span
                          className={`admin-status ${status === "APPROVED" ? "status-active" : "status-blocked"}`}
                        >
                          {status === "APPROVED"
                            ? "Approved"
                            : status === "CANCELLED"
                              ? "Cancelled"
                              : "Rejected"}
                        </span>
                      ) : (
                        <div className="admin-deposit-actions">
                          <button
                            className="admin-row-action is-approve"
                            type="button"
                            onClick={() => updatePayment(payment, "APPROVE")}
                            disabled={updatingId === paymentId}
                          >
                            {updatingId === paymentId ? "Saving..." : "Approve"}
                          </button>
                          <button
                            className="admin-row-action is-danger"
                            type="button"
                            onClick={() => openRejectDialog(payment)}
                            disabled={updatingId === paymentId}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="admin-table-empty">
                  {payments.length
                    ? "No deposits match these filters."
                    : "No deposit records yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rejectingPayment && (
        <div
          className="admin-reject-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRejectDialog();
          }}
        >
          <section
            className="admin-reject-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deposit-reject-title"
          >
            <div className="admin-reject-heading">
              <span className="admin-eyebrow">DEPOSIT DECISION</span>
              <h3 id="deposit-reject-title">Reject payment</h3>
              <p>Add a remark explaining why this payment is being rejected.</p>
            </div>
            <form onSubmit={submitRejection}>
              <label className="admin-reject-field">
                <span>Rejection remark</span>
                <textarea
                  value={rejectionRemark}
                  onChange={(event) => setRejectionRemark(event.target.value)}
                  maxLength={300}
                  rows={4}
                  placeholder="Enter the reason for rejection"
                  required
                />
              </label>
              {error && (
                <p className="admin-reject-error" role="alert">
                  {error}
                </p>
              )}
              <div className="admin-reject-actions">
                <button
                  className="admin-refresh"
                  type="button"
                  onClick={closeRejectDialog}
                  disabled={Boolean(updatingId)}
                >
                  Cancel
                </button>
                <button
                  className="admin-row-action is-danger"
                  type="submit"
                  disabled={Boolean(updatingId)}
                >
                  {updatingId ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
