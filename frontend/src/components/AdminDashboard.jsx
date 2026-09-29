import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Clock, Eye, AlertTriangle, Search, Filter } from 'lucide-react';

export default function AdminDashboard({ stats, refunds, statusFilter, setStatusFilter, onSelectRefund }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRefunds = refunds.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.customer_name?.toLowerCase().includes(term) ||
      r.customer_email?.toLowerCase().includes(term) ||
      r.order_number?.toLowerCase().includes(term) ||
      r.product_name?.toLowerCase().includes(term) ||
      r.status?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      {/* Top Live Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Total Requests */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#9ca3af', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Requests</span>
            <Filter size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.total_requests}</div>
          <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.25rem' }}>Processed across all policy branches</div>
        </div>

        {/* Approved */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#9ca3af', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Approved</span>
            <CheckCircle size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{stats.approved}</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Automated & Manual Approved</div>
        </div>

        {/* Denied */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#9ca3af', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Denied</span>
            <XCircle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>{stats.denied}</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Age limit & Final Sale policy</div>
        </div>

        {/* Escalated / Pending Review */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderColor: stats.pending_review > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#9ca3af', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Pending Review</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>{stats.pending_review}</div>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>High-value & Injection escalations</div>
        </div>

      </div>

      {/* Main Request Table Glass Panel */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        
        {/* Table Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          
          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.375rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {['ALL', 'ESCALATED', 'APPROVED', 'DENIED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '6px', fontSize: '0.75rem' }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search customer, order, product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
              />
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Order & Item</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Guard Check</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    No refund requests found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((req) => (
                  <tr key={req.id} onClick={() => onSelectRefund(req)}>
                    <td style={{ fontWeight: 700, color: '#6366f1' }}>#{req.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{req.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{req.customer_email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{req.product_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{req.order_number}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>${req.item_price?.toFixed(2)}</td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.8125rem' }}>
                        {req.reason_category?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {req.injection_detected ? (
                        <span className="status-badge injection">
                          <AlertTriangle size={12} /> Injection
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Passed</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${req.status.toLowerCase()}`}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRefund(req);
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={12} /> Audit Log
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
