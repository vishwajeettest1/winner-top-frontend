import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';

export default function AdminDashboard() {
  const [ledger, setLedger] = useState(null);

  useEffect(() => {
    client.get('/admin/ledger').then((res) => setLedger(res.data)).catch(() => {});
  }, []);

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Link className="btn" to="/admin/users">Users</Link>
        <Link className="btn" to="/admin/withdrawals">Withdrawals</Link>
        <Link className="btn" to="/admin/content">Videos & Campaigns</Link>
      </div>

      {ledger && (
        <div className="card">
          <h3>Financial Ledger</h3>
          <div>Ad-network revenue: ${ledger.adNetworkRevenue.toFixed(2)}</div>
          <div>Sponsored revenue: ${ledger.sponsoredRevenue.toFixed(2)}</div>
          <div>Total gross revenue: ${ledger.totalGrossRevenue.toFixed(2)}</div>
          <div>Paid to users: ${ledger.totalPaidToUsers.toFixed(2)}</div>
          <div>Paid to referrers: ${ledger.totalPaidToReferrers.toFixed(2)}</div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>
            Platform margin: ${ledger.platformMargin.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
