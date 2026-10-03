import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminPayments() {
  return <Navigate to="/admin/deposits/history" replace />;
}
