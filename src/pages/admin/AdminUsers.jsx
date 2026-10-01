import React, { useEffect, useMemo, useState } from "react";
import client from "../../api/client";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await client.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not load users. Check the admin API and retry.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesStatus =
        statusFilter === "ALL" || user.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        [user.email, user.mobileNumber, user._id].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedQuery),
        );
      return matchesStatus && matchesQuery;
    });
  }, [users, query, statusFilter]);

  async function toggleStatus(user) {
    const status = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    setSavingId(user._id);
    setError("");
    try {
      await client.patch(`/admin/users/${user._id}/status`, { status });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Could not update this account.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="container admin-table-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">ACCOUNT ACCESS</p>
          <h2>Users</h2>
          <p>Search accounts and manage platform access.</p>
        </div>
        <span className="admin-count">{users.length} accounts</span>
      </div>
      <div className="admin-table-controls">
        <input
          aria-label="Search users"
          placeholder="Search email, mobile or ID"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>
      {error && (
        <div className="admin-notice admin-notice-error" role="alert">
          {error}
        </div>
      )}
      <div className="admin-table-scroll">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Mobile</th>
              <th>Account status</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="admin-table-empty">
                  Loading accounts...
                </td>
              </tr>
            ) : visibleUsers.length ? (
              visibleUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.email || "—"}</td>
                  <td>{user.mobileNumber || "—"}</td>
                  <td>
                    <span
                      className={`admin-status ${user.status === "ACTIVE" ? "status-active" : "status-blocked"}`}
                    >
                      {user.status || "UNKNOWN"}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`admin-row-action${user.status === "ACTIVE" ? " is-danger" : ""}`}
                      type="button"
                      onClick={() => toggleStatus(user)}
                      disabled={savingId === user._id}
                    >
                      {savingId === user._id
                        ? "Saving..."
                        : user.status === "ACTIVE"
                          ? "Block account"
                          : "Restore access"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="admin-table-empty">
                  No accounts match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
