import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DemoScenarios from './components/DemoScenarios';
import CustomerChat from './components/CustomerChat';
import AdminDashboard from './components/AdminDashboard';
import AuditModal from './components/AuditModal';
import { fetchCustomers, fetchStats, fetchRefunds, fetchConfig, reseedDatabase } from './api';
import { AlertCircle, X, Key } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'admin'
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total_requests: 0, approved: 0, denied: 0, escalated: 0, pending_review: 0 });
  const [refunds, setRefunds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedRefundForAudit, setSelectedRefundForAudit] = useState(null);
  const [isReseeding, setIsReseeding] = useState(false);
  const [loading, setLoading] = useState(true);

  // API Key Config and Toast state
  const [apiConfig, setApiConfig] = useState({ has_api_key: false, mode: 'fallback_engine' });
  const [showToast, setShowToast] = useState(false);

  const loadData = async () => {
    try {
      const [custData, statsData, refundData, cfgData] = await Promise.all([
        fetchCustomers(),
        fetchStats(),
        fetchRefunds(statusFilter),
        fetchConfig().catch(() => ({ has_api_key: false, mode: 'fallback_engine' })),
      ]);
      setCustomers(custData);
      setStats(statsData);
      setRefunds(refundData);
      if (cfgData) {
        setApiConfig(cfgData);
        if (!cfgData.has_api_key) {
          setShowToast(true);
        }
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      await reseedDatabase();
      await loadData();
      alert('Mock database successfully reset & re-seeded with 15 test customers!');
    } catch (err) {
      alert(`Failed to reseed database: ${err.message}`);
    } finally {
      setIsReseeding(false);
    }
  };

  const handleSelectScenario = (sc) => {
    setSelectedScenario(sc);
    setActiveTab('customer');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6366f1', fontFamily: 'sans-serif' }}>
        <h2>Loading RefundShield Engine...</h2>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ position: 'relative', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Top Bar Navigation & Brand */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReseed={handleReseed}
        isReseeding={isReseeding}
        apiConfig={apiConfig}
      />

      {/* Main Body Content based on Active Tab */}
      {activeTab === 'customer' ? (
        <>
          {/* One-Click Demo Scenarios Toolbar */}
          <DemoScenarios onSelectScenario={handleSelectScenario} />
          {/* Customer Support Chat */}
          <CustomerChat
            customers={customers}
            selectedScenario={selectedScenario}
            onRefundSubmitted={loadData}
            hasApiKey={apiConfig.has_api_key}
          />
        </>
      ) : (
        /* Admin Dashboard */
        <AdminDashboard
          stats={stats}
          refunds={refunds}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onSelectRefund={(req) => setSelectedRefundForAudit(req)}
        />
      )}

      {/* Audit Detail Modal */}
      {selectedRefundForAudit && (
        <AuditModal
          refund={selectedRefundForAudit}
          onClose={() => setSelectedRefundForAudit(null)}
          onReviewed={loadData}
        />
      )}

      {/* Toast Notification when API keys are missing */}
      {showToast && (
        <div className="api-toast">
          <Key size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: '2px', color: '#fbbf24' }}>API Keys Notice</div>
            <div style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
              Input API ENV keys in <code>.env</code> (<code>ANTHROPIC_API_KEY</code> or <code>OPENAI_API_KEY</code>) in order for live LLM responses to work smoothly. Intelligent local fallback engine is active.
            </div>
          </div>
          <button
            onClick={() => setShowToast(false)}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
            title="Dismiss notice"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
