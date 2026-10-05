import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import ClientPageHeader from "../components/ClientPageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function ChangePassword() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await client.post("/user/change-password", {
        currentPassword,
        newPassword,
      });
      setSuccess(true);
      window.setTimeout(() => {
        logout();
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (err.response
            ? "Unable to change password. Please try again."
            : "Can't reach the StreamEarn API."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="client-page account-page">
      <ClientPageHeader
        eyebrow="ACCOUNT"
        title="Change password"
        description="Choose a new password. You will be signed out and asked to log in again."
      />
      {error && (
        <div className="client-feedback is-error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="client-feedback is-success" role="status">
          Password updated. Redirecting to login…
        </div>
      )}
      <form className="account-card account-form" onSubmit={handleSubmit}>
        <label>
          <span>Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label>
          <span>New password</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </label>
        <label>
          <span>Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        <button
          className="account-submit"
          type="submit"
          disabled={submitting || success}
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
