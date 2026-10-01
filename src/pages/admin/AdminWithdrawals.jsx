import React, { useEffect, useState } from "react";
import client from "../../api/client";

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await client.get("/admin/withdrawals", {
        params: { status: "PENDING" },
      });
      setWithdrawals(res.data.withdrawals || []);
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

  async function review(withdrawal, action) {
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
      });
      setMessage(
        `Withdrawal ${action === "APPROVE" ? "approved" : "rejected"}.`,
      );
      await load();
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not update this withdrawal.",
      );
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="container admin-table-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">PAYOUT OPERATIONS</p>
          <h2>Withdrawals</h2>
          <p>
            Review pending payout requests and record transaction references.
          </p>
        </div>
        <span className="admin-count">{withdrawals.length} pending</span>
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
      <div className="admin-table-scroll">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Requested</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="admin-table-empty">
                  Loading requests...
                </td>
              </tr>
            ) : withdrawals.length ? (
              withdrawals.map((withdrawal) => (
                <tr key={withdrawal._id}>
                  <td>{withdrawal.userId?.email || "Unknown user"}</td>
                  <td className="admin-money-cell">
                    ${Number(withdrawal.amount || 0).toFixed(2)}
                  </td>
                  <td>
                    {withdrawal.requestedAt
                      ? new Date(withdrawal.requestedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="admin-action-cell">
                    <button
                      className="admin-row-action is-approve"
                      type="button"
                      onClick={() => review(withdrawal, "APPROVE")}
                      disabled={reviewingId === withdrawal._id}
                    >
                      {reviewingId === withdrawal._id ? "Saving..." : "Approve"}
                    </button>
                    <button
                      className="admin-row-action is-danger"
                      type="button"
                      onClick={() => review(withdrawal, "REJECT")}
                      disabled={reviewingId === withdrawal._id}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="admin-table-empty">
                  No pending withdrawals.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
