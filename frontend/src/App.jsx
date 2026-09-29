import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DemoScenarios from './components/DemoScenarios';
import CustomerChat from './components/CustomerChat';
import AdminDashboard from './components/AdminDashboard';
import AuditModal from './components/AuditModal';
import { fetchCustomers, fetchStats, fetchRefunds, reseedDatabase } from './api';

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

  const loadData = async () => {
    try {
      const [custData, statsData, refundData] = await Promise.all([
        fetchCustomers(),
        fetchStats(),
        fetchRefunds(statusFilter),
      ]);
      setCustomers(custData);
      setStats(statsData);
      setRefunds(refundData);
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
        <h2>Loading RefundShield AI Engine...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Bar Navigation & Brand */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReseed={handleReseed}
        isReseeding={isReseeding}
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
    </div>
  );
}
