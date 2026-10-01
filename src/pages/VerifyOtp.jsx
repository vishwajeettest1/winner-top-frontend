import React, { useState } from "react";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const pendingUserId = location.state?.userId;
  const [otpCode, setOtpCode] = useState(location.state?.devOtp || "");
  const [error, setError] = useState("");

  if (!pendingUserId) {
    return <Navigate to="/register" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await client.post("/auth/verify-otp", {
        userId: pendingUserId,
        otpCode,
      });
      login(res.data.token);
      navigate("/", { state: { accountVerified: true } });
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed");
    }
  }

  return (
    <div className="register-page">
      <header className="register-topbar">
        <Link className="register-brand" to="/login" aria-label="StreamEarn">
          <span className="register-brand-mark">S</span>
          <span>
            stream<span>earn</span>
          </span>
        </Link>
        <span className="register-topnote">ACCOUNT VERIFICATION</span>
      </header>

      <main className="register-main">
        <div className="register-intro">
          <span className="register-kicker">
            <span /> ALMOST THERE
          </span>
          <h1>
            One last
            <br />
            <em>step.</em>
          </h1>
          <p>Enter the verification code sent to your mobile or email.</p>
        </div>

        <section className="register-panel" aria-labelledby="verify-title">
          <div className="register-panel-heading">
            <div>
              <h2 id="verify-title">Verify your account</h2>
              <p>Enter your 6-digit verification code.</p>
            </div>
            <span className="register-step">
              02 <span>/ 02</span>
            </span>
          </div>

          {location.state?.devOtp && (
            <div className="register-dev-code">
              <span>DEVELOPMENT CODE</span>
              <strong>{location.state.devOtp}</strong>
            </div>
          )}
          {error && (
            <div className="register-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <label className="register-field">
              <span>Verification code</span>
              <input
                className="register-otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="••••••"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
              />
            </label>
            <button className="register-submit" type="submit">
              Verify and continue <span aria-hidden="true">→</span>
            </button>
          </form>
          <p className="register-terms">
            Your account will be ready as soon as your code is confirmed.
          </p>
        </section>

        <p className="register-login">
          Need to start over?{" "}
          <Link to="/register">
            Create an account <span aria-hidden="true">→</span>
          </Link>
        </p>
      </main>

      <footer className="register-footer">
        <span className="register-footer-mark">✳</span>
        <span>A quick check to protect your account</span>
      </footer>
    </div>
  );
}
