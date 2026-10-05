import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSweeping(true);
    window.setTimeout(() => setIsSweeping(false), 900);
    setIsSubmitting(true);
    try {
      let userLoginError;
      try {
        const userRes = await client.post("/auth/login", { email, password });
        const userToken = userRes.data?.token || userRes.data?.accessToken;
        if (!userToken) {
          throw new Error("The login response did not include an access token.");
        }
        localStorage.removeItem("streamearn_admin_token");
        login(userToken);
        navigate("/");
        return;
      } catch (err) {
        userLoginError = err;
        const status = err.response?.status;
        if (!status || ![400, 401, 403, 404].includes(status)) throw err;
      }

      try {
        const adminRes = await client.post("/admin/login", { email, password });
        const adminToken = adminRes.data?.token || adminRes.data?.accessToken;
        if (!adminToken) {
          throw new Error("The admin login response did not include an access token.");
        }
        logout();
        localStorage.setItem("streamearn_admin_token", adminToken);
        navigate("/admin");
      } catch (adminErr) {
        const status = adminErr.response?.status;
        if (!status || status >= 500) throw adminErr;
        throw userLoginError;
      }
    } catch (err) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.error || err.response?.data?.message;
      if (serverMessage) {
        setError(serverMessage);
      } else if (!err.response && err.message?.includes("access token")) {
        setError(err.message);
      } else if (!err.response) {
        setError(
          "Can't reach the StreamEarn API. Check that the backend is running and VITE_API_BASE_URL points to its /api URL."
        );
      } else if (status === 429) {
        setError("Too many login attempts. Please wait a few minutes and try again.");
      } else if (status === 401 || status === 403) {
        setError("Invalid email or password.");
      } else {
        setError(`Login failed (HTTP ${status}). Please try again.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="register-page auth-login-page">
      <header className="register-topbar">
        <Link className="register-brand" to="/login" aria-label="StreamEarn">
          <span className="register-brand-mark">S</span>
          <span>
            stream<span>earn</span>
          </span>
        </Link>
        <span className="register-topnote">SIGN IN</span>
      </header>

      <main className="register-main">
        <div className="register-intro">
          <span className="register-kicker">
            <span /> CONTINUE YOUR JOURNEY
          </span>
          <h1>
            Welcome
            <br />
            <em>back.</em>
          </h1>
          <p>
            Sign in to pick up where you left off and keep your rewards moving.
          </p>
        </div>

        <section className="register-panel" aria-labelledby="login-title">
          <div className="register-panel-heading">
            <div>
              <h2 id="login-title">Log in to your account</h2>
              <p>Use your email and password to continue.</p>
            </div>
          </div>

          {error && (
            <div className="register-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <label className="register-field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="register-field">
              <span>Password</span>
              <span className="register-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <button
              className={`register-submit${isSubmitting ? " is-submitting" : ""}${isSweeping ? " is-sweeping" : ""}`}
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Logging in…" : "Log in"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </section>

        <p className="register-login">
          New to StreamEarn?{" "}
          <Link to="/register">
            Create an account <span aria-hidden="true">→</span>
          </Link>
        </p>
      </main>

      <footer className="register-footer">
        <span className="register-footer-mark">✳</span>
        <span>Your next reward is waiting</span>
      </footer>
    </div>
  );
}
