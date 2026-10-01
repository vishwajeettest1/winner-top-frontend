import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import client from "../api/client";

export default function Register() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    mobileNumber: "",
    email: "",
    password: "",
    referralCode: searchParams.get("ref") || "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSweeping(true);
    window.setTimeout(() => setIsSweeping(false), 900);
    setIsSubmitting(true);
    try {
      const res = await client.post("/auth/register", form);
      navigate("/verify-otp", {
        state: {
          userId: res.data.userId,
          devOtp: res.data.devOtp,
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="register-page auth-signup-page">
      <header className="register-topbar">
        <Link
          className="register-brand"
          to="/login"
          aria-label="StreamEarn home"
        >
          <span className="register-brand-mark">S</span>
          <span>
            stream<span>earn</span>
          </span>
        </Link>
        <span className="register-topnote">CREATE ACCOUNT</span>
      </header>

      <main className="register-main">
        <div className="register-intro">
          <span className="register-kicker">
            <span /> START YOUR JOURNEY
          </span>
          <h1>
            Start earning
            <br />
            <em>smarter.</em>
          </h1>
          <p>
            Create your account, verify your details, and begin your StreamEarn
            journey.
          </p>
        </div>

        <section
          className="register-panel"
          aria-labelledby="register-form-title"
        >
          <div className="register-panel-heading">
            <div>
              <h2 id="register-form-title">Join StreamEarn</h2>
              <p>Set up your account in less than a minute.</p>
            </div>
            <span className="register-step">
              01 <span>/ 02</span>
            </span>
          </div>

          {error && (
            <div className="register-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <label className="register-field">
              <span>Mobile number</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="e.g. 98765 43210"
                value={form.mobileNumber}
                onChange={(e) =>
                  setForm({ ...form, mobileNumber: e.target.value })
                }
                required
              />
            </label>
            <label className="register-field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="register-field">
              <span>Password</span>
              <span className="register-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <button
                  className="register-password-toggle"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span
                    className={`register-eye-icon${showPassword ? " is-visible" : ""}`}
                    aria-hidden="true"
                  >
                    <span />
                  </span>
                </button>
              </span>
            </label>
            <label className="register-field">
              <span>
                Referral code{" "}
                <span className="register-optional">OPTIONAL</span>
              </span>
              <input
                autoComplete="off"
                placeholder="Got a code? Add it here"
                value={form.referralCode}
                onChange={(e) =>
                  setForm({ ...form, referralCode: e.target.value })
                }
              />
            </label>
            <button
              className={`register-submit${isSubmitting ? " is-submitting" : ""}${isSweeping ? " is-sweeping" : ""}`}
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Creating your account…" : "Create my account"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
          <p className="register-terms">
            Next, verify your mobile number to finish setting up your account.
          </p>
        </section>

        <p className="register-login">
          Already have an account?{" "}
          <Link to="/login">
            Log in <span aria-hidden="true">→</span>
          </Link>
        </p>
      </main>

      <footer className="register-footer">
        <span className="register-footer-mark">✳</span>
        <span>No payment required</span>
        <span className="register-footer-divider" />
        <span>Verify by text message</span>
      </footer>
    </div>
  );
}
