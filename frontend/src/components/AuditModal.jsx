import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, Bot, CheckCircle, XCircle, FileText, UserCheck, Lock } from 'lucide-react';
import { reviewRefund } from '../api';

export default function AuditModal({ refund, onClose, onReviewed }) {
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!refund) return null;

  const handleReviewAction = async (action) => {
    setIsSubmitting(true);
    try {
      await reviewRefund(refund.id, action, adminNotes);
      alert(`Status successfully updated to ${action}`);
      if (onReviewed) onReviewed();
      onClose();
    } catch (err) {
      alert(`Error updating review: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.75rem',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.5rem', borderRadius: '10px' }}>
            <FileText size={22} color="#6366f1" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Refund Audit Log #{refund.id}
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Created: {new Date(refund.created_at).toLocaleString()}
            </div>
          </div>
          <span className={`status-badge ${refund.status.toLowerCase()} ${refund.injection_detected ? 'injection' : ''}`} style={{ marginLeft: 'auto' }}>
            {refund.status}
          </span>
        </div>

        {/* Customer & Product Summary Panel */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8125rem' }}>
            <div>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>CUSTOMER</div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginTop: '0.125rem' }}>{refund.customer_name}</div>
              <div style={{ color: '#6366f1' }}>{refund.customer_email}</div>
            </div>
            <div>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>ITEM & ORDER</div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginTop: '0.125rem' }}>{refund.product_name}</div>
              <div style={{ color: '#9ca3af' }}>{refund.order_number} • ${refund.item_price?.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Section 1: Security Guard Check */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <ShieldCheck size={16} color="#ec4899" /> Step 1: Prompt Injection Guard
          </h4>
          <div style={{
            background: refund.injection_detected ? 'rgba(236, 72, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${refund.injection_detected ? 'rgba(236, 72, 153, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: '10px',
            padding: '0.875rem',
            fontSize: '0.8125rem',
          }}>
            {refund.injection_detected ? (
              <div style={{ color: '#f472b6' }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <AlertTriangle size={15} /> PROMPT INJECTION ATTACK INTERCEPTED
                </div>
                <div style={{ marginTop: '0.25rem' }}>
                  Matched Regex Patterns: <code>{refund.injection_patterns}</code>
                </div>
              </div>
            ) : (
              <div style={{ color: '#34d399', fontWeight: 600 }}>
                ✅ Security Guard Clean: No prompt injection or instruction overrides detected in customer input.
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Policy Engine Evaluation */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Lock size={16} color="#6366f1" /> Step 2: Deterministic Policy Engine Authority
          </h4>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.875rem' }}>
            <div style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
              <strong>Matched Policy Rule:</strong> <span style={{ color: '#818cf8', fontWeight: 700 }}>{refund.policy_matched_rule}</span>
            </div>
            <div style={{ fontSize: '0.8125rem', marginBottom: '0.75rem', color: '#d1d5db' }}>
              <strong>Explanation:</strong> {refund.policy_explanation}
            </div>
            
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.375rem' }}>
              REASONING STEPS EXECUTION LOG:
            </div>
            <div className="code-block" style={{ maxHeight: '180px' }}>
              {refund.reasoning_logs && refund.reasoning_logs.map((step, idx) => (
                <div key={idx}>{step}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Service Classification & Customer Reply Draft */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Bot size={16} color="#8b5cf6" /> Step 3: AI Classification & Reply Draft
          </h4>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', color: '#9ca3af' }}>
              <div>Sentiment: <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>{refund.ai_sentiment}</strong></div>
              <div>Summary: <strong style={{ color: '#ffffff' }}>{refund.ai_summary}</strong></div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #8b5cf6', marginTop: '0.5rem', color: '#f3f4f6', whiteSpace: 'pre-wrap' }}>
              {refund.ai_suggested_reply}
            </div>
          </div>
        </div>

        {/* Human Supervisor Override Action Controls (If Escalated or Admin Review) */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <UserCheck size={16} /> Human Supervisor Action & Review
          </h4>

          {refund.admin_notes && (
            <div style={{ fontSize: '0.8125rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.625rem', borderRadius: '8px', marginBottom: '0.75rem', color: '#fbbf24' }}>
              <strong>Admin Notes:</strong> {refund.admin_notes}
            </div>
          )}

          <div style={{ marginBottom: '0.875rem' }}>
            <textarea
              placeholder="Add optional supervisor audit notes (e.g. Verified customer ID, approved manual exception)..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="input-control"
              rows={2}
              style={{ fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleReviewAction('MANUAL_DENIED')}
              disabled={isSubmitting}
              className="btn btn-danger"
            >
              <XCircle size={16} /> Deny Refund (Manual)
            </button>
            <button
              onClick={() => handleReviewAction('MANUAL_APPROVED')}
              disabled={isSubmitting}
              className="btn btn-success"
            >
              <CheckCircle size={16} /> Approve Refund (Manual)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
