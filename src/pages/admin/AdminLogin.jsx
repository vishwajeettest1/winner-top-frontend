import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await client.post("/admin/login", { email, password });
      localStorage.setItem("streamearn_admin_token", res.data.token);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="container">
      <h1>Admin Login</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit} className="card">
        <input
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn" type="submit">
          Log in
        </button>
      </form>
    </div>
  );
}
