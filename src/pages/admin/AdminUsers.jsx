import React, { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    client.get('/admin/users').then((res) => setUsers(res.data.users));
  }

  async function toggleStatus(user) {
    const status = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    await client.put(`/admin/users/${user._id}/status`, { status });
    loadUsers();
  }

  return (
    <div className="container">
      <h1>Users</h1>
      <table>
        <thead><tr><th>Email</th><th>Mobile</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.email}</td>
              <td>{u.mobileNumber}</td>
              <td>{u.status}</td>
              <td><button className="btn" onClick={() => toggleStatus(u)}>
                {u.status === 'ACTIVE' ? 'Block' : 'Unblock'}
              </button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
