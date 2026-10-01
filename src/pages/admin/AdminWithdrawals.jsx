import React, { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    load();
  }, []);

  function load() {
    client.get('/admin/withdrawals', { params: { status: 'PENDING' } }).then((res) => setWithdrawals(res.data.withdrawals));
  }

  async function review(id, action) {
    const transactionRef = action === 'APPROVE' ? prompt('Transaction reference:') : undefined;
    await client.put(`/admin/withdrawals/${id}`, { action, transactionRef });
    load();
  }

  return (
    <div className="container">
      <h1>Pending Withdrawals</h1>
      <table>
        <thead><tr><th>User</th><th>Amount</th><th>Requested</th><th></th></tr></thead>
        <tbody>
          {withdrawals.map((w) => (
            <tr key={w._id}>
              <td>{w.userId?.email}</td>
              <td>${w.amount.toFixed(2)}</td>
              <td>{new Date(w.requestedAt).toLocaleDateString()}</td>
              <td>
                <button className="btn" onClick={() => review(w._id, 'APPROVE')}>Approve</button>{' '}
                <button className="btn" onClick={() => review(w._id, 'REJECT')}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
