import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import VideoPlayer from "./pages/VideoPlayer.jsx";
import Wallet from "./pages/Wallet.jsx";
import Referrals from "./pages/Referrals.jsx";
import Withdrawals from "./pages/Withdrawals.jsx";
import HelpCenter from "./pages/HelpCenter.jsx";
import HelpContact from "./pages/HelpContact.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import Profile from "./pages/Profile.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import ManagePayments from "./pages/ManagePayments.jsx";
import BottomNav from "./components/BottomNav.jsx";

import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals.jsx";
import AdminContactRequests from "./pages/admin/AdminContactRequests.jsx";
import AdminContent from "./pages/admin/AdminContent.jsx";
import AdminDeposit from "./pages/admin/AdminDeposit.jsx";
import AdminDepositHistory from "./pages/admin/AdminDepositHistory.jsx";

function RequireAuth({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem("streamearn_admin_token");
  if (!token) return <Navigate to="/login" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function ClientLayout({ children }) {
  return (
    <div className="container" style={{ paddingBottom: 70 }}>
      {children}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <ClientLayout>
                  <Dashboard />
                </ClientLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/watch"
            element={
              <RequireAuth>
                <ClientLayout>
                  <VideoPlayer />
                </ClientLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/wallet"
            element={
              <RequireAuth>
                <ClientLayout>
                  <Wallet />
                </ClientLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/referrals"
            element={
              <RequireAuth>
                <ClientLayout>
                  <Referrals />
                </ClientLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/withdrawals"
            element={
              <RequireAuth>
                <ClientLayout>
                  <Withdrawals />
                </ClientLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/help"
            element={
              <RequireAuth>
                <ClientLayout>
                  <HelpCenter />
                </ClientLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/help-contact"
            element={
              <RequireAuth>
                <ClientLayout>
                  <HelpContact />
                </ClientLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/about"
            element={
              <RequireAuth>
                <ClientLayout>
                  <AboutUs />
                </ClientLayout>
              </RequireAuth>
            }
          />

          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ClientLayout>
                  <Profile />
                </ClientLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/change-password"
            element={
              <RequireAuth>
                <ClientLayout>
                  <ChangePassword />
                </ClientLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/payments"
            element={
              <RequireAuth>
                <ClientLayout>
                  <ManagePayments />
                </ClientLayout>
              </RequireAuth>
            }
          />

          <Route
            path="/admin/login"
            element={<Navigate to="/login" replace />}
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireAdmin>
                <AdminUsers />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/withdrawals"
            element={
              <RequireAdmin>
                <AdminWithdrawals />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/supports"
            element={
              <RequireAdmin>
                <AdminContactRequests />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/content"
            element={
              <RequireAdmin>
                <AdminContent />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/deposits"
            element={
              <RequireAdmin>
                <AdminDeposit />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/deposits/history"
            element={
              <RequireAdmin>
                <AdminDepositHistory />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/payments"
            element={<Navigate to="/admin/deposits/history" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
