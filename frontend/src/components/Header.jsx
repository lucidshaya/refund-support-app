import React from 'react';
import { ShieldCheck, MessageSquare, LayoutDashboard, RefreshCw, Cpu, Lock, Key } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, onReseed, isReseeding, apiConfig }) {
  const hasKey = apiConfig?.has_api_key;

  return (
    <header className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            padding: '0.625rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldCheck size={26} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #d1d5db)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              RefundShield AI
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10b981' }}>
                <Lock size={12} /> Deterministic Policy Authority
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#ec4899' }}>
                <Cpu size={12} /> Prompt Injection Guard Active
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '0.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            onClick={() => setActiveTab('customer')}
            className={`btn ${activeTab === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '8px', padding: '0.5rem 1rem' }}
          >
            <MessageSquare size={16} /> Customer Portal
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '8px', padding: '0.5rem 1rem' }}
          >
            <LayoutDashboard size={16} /> Admin Dashboard
          </button>
        </div>

        {/* Action Controls & API Engine Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: hasKey ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: hasKey ? '#10b981' : '#f59e0b',
            border: `1px solid ${hasKey ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
          }}
          title={hasKey ? 'Live LLM API keys loaded from .env' : 'Input API ENV keys in .env to enable live LLM responses'}
          >
            <Key size={12} />
            {hasKey ? 'Live LLM Engine' : 'Fallback Engine (No ENV Keys)'}
          </span>

          <button
            onClick={onReseed}
            disabled={isReseeding}
            className="btn btn-secondary btn-sm"
            title="Reset SQLite database with 15 test scenarios"
          >
            <RefreshCw size={14} className={isReseeding ? 'spin' : ''} />
            {isReseeding ? 'Reseeding...' : 'Reset Mock Data'}
          </button>
        </div>
      </div>
    </header>
  );
}
