import React, { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import client from "../../api/client";

const terminalStatuses = new Set(["APPROVED", "PAID", "REJECTED", "CANCELLED"]);

function getWithdrawalTimestamp(withdrawal) {
  const timestamp = new Date(
    withdrawal.requestedAt || withdrawal.createdAt || 0,
  ).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState(null);
  const [rejectionRemark, setRejectionRemark] = useState("");
  const [filters, setFilters] = useState({
    user: "",
    mobile: "",
    amount: "",
    requestedOn: "",
    status: "",
    actions: "",
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await client.get("/admin/withdrawals", {
        params: { status: "ALL" },
      });
      setWithdrawals(
        (res.data.withdrawals || []).sort(
          (first, second) =>
            getWithdrawalTimestamp(second) - getWithdrawalTimestamp(first),
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not load withdrawal requests. Check the admin API and retry.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(withdrawal, action, remark = "") {
    const transactionRef =
      action === "APPROVE"
        ? window.prompt("Transaction reference:")
        : undefined;
    if (action === "APPROVE" && transactionRef === null) return;
    setReviewingId(withdrawal._id);
    setError("");
    setMessage("");
    try {
      await client.patch(`/admin/withdrawals/${withdrawal._id}`, {
        action,
        transactionRef,
        rejectionReason: remark.trim(),
      });
      setMessage(
        `Withdrawal ${action === "APPROVE" ? "approved" : "rejected"}.`,
      );
      if (action === "REJECT") {
        setRejectingWithdrawal(null);
        setRejectionRemark("");
      }
      await load();
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not update this withdrawal.",
      );
    } finally {
      setReviewingId(null);
    }
  }

  function openRejectDialog(withdrawal) {
    setError("");
    setRejectionRemark("");
    setRejectingWithdrawal(withdrawal);
  }

  function closeRejectDialog() {
    if (reviewingId) return;
    setRejectingWithdrawal(null);
    setRejectionRemark("");
  }

  function submitRejection(event) {
    event.preventDefault();
    if (!rejectionRemark.trim()) {
      setError("Enter a remark before rejecting this withdrawal.");
      return;
    }
    review(rejectingWithdrawal, "REJECT", rejectionRemark);
  }

  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    const email = String(
      withdrawal.userId?.email || withdrawal.user?.email || "",
    ).toLowerCase();
    const mobile = String(
      withdrawal.userId?.mobileNumber || withdrawal.user?.mobileNumber || "",
    ).toLowerCase();
    const status = String(withdrawal.status || "PENDING").toUpperCase();
    const requestedAt = withdrawal.requestedAt;
    const requestedDate = requestedAt ? new Date(requestedAt) : null;
    const localDate =
      requestedDate && !Number.isNaN(requestedDate.getTime())
        ? `${requestedDate.getFullYear()}-${String(requestedDate.getMonth() + 1).padStart(2, "0")}-${String(requestedDate.getDate()).padStart(2, "0")}`
        : "";
    const needsAction = !terminalStatuses.has(status);

    return (
      email.includes(filters.user.trim().toLowerCase()) &&
      mobile.includes(filters.mobile.trim().toLowerCase()) &&
      (!filters.amount ||
        Number(withdrawal.amount) === Number(filters.amount)) &&
      (!filters.requestedOn || localDate === filters.requestedOn) &&
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

  return (
    <div className="container admin-table-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">PAYOUT OPERATIONS</p>
          <h2>Withdrawals</h2>
          <p>Review pending payouts and track withdrawal request statuses.</p>
        </div>
        <div className="admin-payment-heading-actions">
          <span className="admin-count">
            {filteredWithdrawals.length === withdrawals.length
              ? `${withdrawals.length} withdrawals`
              : `${filteredWithdrawals.length} of ${withdrawals.length} withdrawals`}
          </span>
          <button
            className="admin-refresh"
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Refresh withdrawal requests"
          >
            <FiRefreshCw aria-hidden="true" />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
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
        className="admin-withdrawal-filters"
        aria-label="Filter withdrawal requests"
      >
        <div className="admin-withdrawal-filter-fields">
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
            <span>Amount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.amount}
              onChange={(event) => updateFilter("amount", event.target.value)}
              placeholder="Exact amount"
            />
          </label>
          <label className="admin-field">
            <span>Requested on</span>
            <input
              type="date"
              value={filters.requestedOn}
              onClick={(event) => {
                if (typeof event.currentTarget.showPicker === "function") {
                  event.currentTarget.showPicker();
                }
              }}
              onChange={(event) =>
                updateFilter("requestedOn", event.target.value)
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
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="PAID">Paid</option>
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
          <div className="admin-withdrawal-filter-actions">
            <span>
              {filteredWithdrawals.length} matching{" "}
              {filteredWithdrawals.length === 1 ? "record" : "records"}
            </span>
            <span className="admin-withdrawal-active-filters">
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
                  amount: "",
                  requestedOn: "",
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
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Payout method</th>
              <th>Payout details</th>
              <th>Requested</th>
              <th>Status</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="admin-table-empty">
                  Loading requests...
                </td>
              </tr>
            ) : filteredWithdrawals.length ? (
              filteredWithdrawals.map((withdrawal) => {
                const status = String(
                  withdrawal.status || "PENDING",
                ).toUpperCase();
                const isReviewable = !terminalStatuses.has(status);
                return (
                  <tr key={withdrawal._id}>
                    <td>
                      <span>
                        {withdrawal.userId?.email ||
                          withdrawal.user?.email ||
                          "Unknown user"}
                      </span>
                      {(withdrawal.userId?.mobileNumber ||
                        withdrawal.user?.mobileNumber) && (
                        <small className="admin-deposit-user-mobile">
                          {withdrawal.userId?.mobileNumber ||
                            withdrawal.user?.mobileNumber}
                        </small>
                      )}
                    </td>
                    <td className="admin-money-cell">
                      ${Number(withdrawal.amount || 0).toFixed(2)}
                    </td>
                    <td>
                      {withdrawal.payoutMethod === "UPI"
                        ? "UPI"
                        : withdrawal.payoutMethod === "BANK"
                          ? "Bank"
                          : "—"}
                    </td>
                    <td>
                      {withdrawal.payoutDetails ? (
                        <div className="admin-withdrawal-payout-details">
                          {withdrawal.payoutMethod === "UPI" ? (
                            <>
                              <span>{withdrawal.payoutDetails.name}</span>
                              <small>{withdrawal.payoutDetails.upiId}</small>
                            </>
                          ) : (
                            <>
                              <span>
                                {withdrawal.payoutDetails.accountHolderName}
                              </span>
                              <small>{withdrawal.payoutDetails.bankName}</small>
                              <small>
                                {withdrawal.payoutDetails.accountNumber} ·{" "}
                                {withdrawal.payoutDetails.routingCode}
                              </small>
                            </>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {withdrawal.requestedAt
                        ? new Date(withdrawal.requestedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`admin-status ${status === "PENDING" || status === "UNDER_REVIEW" ? "status-review" : status === "PAID" || status === "APPROVED" ? "status-active" : "status-blocked"}`}
                      >
                        {status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="admin-action-cell">
                      {isReviewable ? (
                        <>
                          <button
                            className="admin-row-action is-approve"
                            type="button"
                            onClick={() => review(withdrawal, "APPROVE")}
                            disabled={reviewingId === withdrawal._id}
                          >
                            {reviewingId === withdrawal._id
                              ? "Saving..."
                              : "Approve"}
                          </button>
                          <button
                            className="admin-row-action is-danger"
                            type="button"
                            onClick={() => openRejectDialog(withdrawal)}
                            disabled={reviewingId === withdrawal._id}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span>{status === "PAID" ? "Paid" : "Reviewed"}</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="admin-table-empty">
                  {withdrawals.length
                    ? "No withdrawals match these filters."
                    : "No withdrawal requests."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rejectingWithdrawal && (
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
            aria-labelledby="withdrawal-reject-title"
          >
            <div className="admin-reject-heading">
              <span className="admin-eyebrow">PAYOUT DECISION</span>
              <h3 id="withdrawal-reject-title">Reject withdrawal</h3>
              <p>
                Add a remark explaining why this withdrawal is being rejected.
              </p>
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
                  disabled={Boolean(reviewingId)}
                >
                  Cancel
                </button>
                <button
                  className="admin-row-action is-danger"
                  type="submit"
                  disabled={Boolean(reviewingId)}
                >
                  {reviewingId ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
