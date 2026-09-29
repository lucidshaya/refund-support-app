const API_BASE = '/api';

export async function fetchCustomers() {
  const res = await fetch(`${API_BASE}/customers`);
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function fetchOrders() {
  const res = await fetch(`${API_BASE}/orders`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchRefunds(statusFilter = 'ALL') {
  const res = await fetch(`${API_BASE}/refunds?status_filter=${statusFilter}`);
  if (!res.ok) throw new Error('Failed to fetch refund requests');
  return res.json();
}

export async function fetchRefundDetail(requestId) {
  const res = await fetch(`${API_BASE}/refunds/${requestId}`);
  if (!res.ok) throw new Error('Failed to fetch refund request details');
  return res.json();
}

export async function submitRefund(payload) {
  const res = await fetch(`${API_BASE}/refunds/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to submit refund request');
  }
  return res.json();
}

export async function reviewRefund(requestId, action, adminNotes = '') {
  const res = await fetch(`${API_BASE}/refunds/${requestId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, admin_notes: adminNotes }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to submit admin review');
  }
  return res.json();
}

export async function fetchConfig() {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}

export async function reseedDatabase() {
  const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reseed database');
  return res.json();
}
