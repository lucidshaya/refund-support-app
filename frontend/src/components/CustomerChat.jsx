import React, { useState, useEffect } from 'react';
import { Send, User, Bot, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Package, Calendar, Tag, DollarSign, Terminal } from 'lucide-react';
import { submitRefund } from '../api';

export default function CustomerChat({ customers, selectedScenario, onRefundSubmitted, hasApiKey }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reasonCategory, setReasonCategory] = useState('size_fit');
  const [customerMessage, setCustomerMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Results / Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [showAuditLogs, setShowAuditLogs] = useState({});

  // Auto populate customer when customers list loads or when scenario changes
  useEffect(() => {
    if (selectedScenario && customers.length > 0) {
      const matchedCust = customers.find(c => c.email.toLowerCase() === selectedScenario.custEmail.toLowerCase());
      if (matchedCust) {
        setSelectedCustomerId(matchedCust.id);
        setReasonCategory(selectedScenario.reason);
        setCustomerMessage(selectedScenario.message);
      }
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedScenario]);

  // When selected customer changes, pick their order & item
  useEffect(() => {
    if (selectedCustomerId && customers.length > 0) {
      const cust = customers.find(c => c.id === Number(selectedCustomerId));
      if (cust && cust.orders && cust.orders.length > 0) {
        const ord = cust.orders[0];
        setSelectedOrder(ord);
        if (ord.items && ord.items.length > 0) {
          setSelectedItem(ord.items[0]);
        }
      }
    }
  }, [selectedCustomerId, customers]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedCustomerId || !selectedOrder || !selectedItem || !customerMessage.trim()) return;

    setIsSubmitting(true);
    const userMsgText = customerMessage;
    const currentCust = customers.find(c => c.id === Number(selectedCustomerId));

    // Append customer message to chat
    const userBubble = {
      id: Date.now(),
      sender: 'user',
      customerName: currentCust ? currentCust.name : 'Customer',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatHistory(prev => [...prev, userBubble]);
    setCustomerMessage('');

    try {
      const response = await submitRefund({
        customer_id: Number(selectedCustomerId),
        order_id: selectedOrder.id,
        item_id: selectedItem.id,
        reason_category: reasonCategory,
        customer_message: userMsgText,
      });

      // Append response bubble
      const aiBubble = {
        id: response.id,
        sender: 'assistant',
        status: response.status,
        explanation: response.policy_explanation,
        replyText: response.ai_suggested_reply,
        injectionDetected: response.injection_detected,
        injectionPatterns: response.injection_patterns,
        matchedRule: response.policy_matched_rule,
        reasoningLogs: response.reasoning_logs,
        aiSentiment: response.ai_sentiment,
        aiSummary: response.ai_summary,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory(prev => [...prev, aiBubble]);
      if (onRefundSubmitted) onRefundSubmitted();
    } catch (err) {
      alert(`Error submitting refund: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAuditLog = (id) => {
    setShowAuditLogs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const currentCustomer = customers.find(c => c.id === Number(selectedCustomerId));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
      
      {/* Left Column: Context Controls */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={18} color="#6366f1" /> Order Context Picker
        </h3>

        {/* Customer Dropdown */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.375rem', uppercase: 'true' }}>
            Select Test Customer
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="select-control"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email}) {c.risk_score >= 0.8 ? '⚠️ High Risk' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Order Summary Card */}
        {selectedOrder && selectedItem && (
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1' }}>{selectedOrder.order_number}</span>
              <span className="status-badge" style={{ fontSize: '0.6875rem' }}>{selectedOrder.status}</span>
            </div>

            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.375rem', color: '#ffffff' }}>
              {selectedItem.product_name}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <DollarSign size={13} /> Price: ${selectedItem.price.toFixed(2)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={13} /> Purchased: {new Date(selectedOrder.purchase_date).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Tag size={13} /> Condition: {selectedItem.condition}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: selectedItem.is_final_sale ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                {selectedItem.is_final_sale ? '❌ Final Sale' : '✅ Eligible Policy'}
              </div>
            </div>
          </div>
        )}

        {/* Reason Selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.375rem' }}>
            Refund Reason Category
          </label>
          <select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            className="select-control"
          >
            <option value="size_fit">Wrong Size / Fit Issue</option>
            <option value="changed_mind">Buyer Remorse / Changed Mind</option>
            <option value="damaged">Damaged Item on Arrival</option>
            <option value="defective">Defective / Malfunctioning</option>
            <option value="wrong_item">Incorrect Item Shipped</option>
          </select>
        </div>

        {/* Customer Risk & Summary Note */}
        {currentCustomer && (
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '8px' }}>
            <div>Risk Rating: <strong style={{ color: currentCustomer.risk_score >= 0.8 ? '#ef4444' : '#10b981' }}>{currentCustomer.risk_score.toFixed(2)}</strong></div>
            <div>Past Requests: <strong>{currentCustomer.total_refunds_requested}</strong></div>
          </div>
        )}
      </div>

      {/* Right Column: Chat Window */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '620px' }}>
        
        {/* Chat History Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.875rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={20} color="#8b5cf6" />
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>AI Refund Assistant Chat</h3>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Powered by Policy Engine & Guard</p>
            </div>
          </div>
          {chatHistory.length > 0 && (
            <button onClick={() => setChatHistory([])} className="btn btn-secondary btn-sm">Clear Chat</button>
          )}
        </div>

        {/* Message Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {chatHistory.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: '#9ca3af', maxWidth: '360px' }}>
              <Bot size={40} color="#6366f1" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#f3f4f6' }}>Start a Refund Conversation</p>
              <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                Select a preset scenario above or type a custom message to test prompt injection defenses and policy rules.
              </p>
            </div>
          ) : (
            chatHistory.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                
                {/* User Bubble */}
                {msg.sender === 'user' ? (
                  <div style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#ffffff', borderRadius: '16px 16px 4px 16px', padding: '0.875rem 1.125rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}>
                    <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginBottom: '0.25rem' }}>{msg.customerName} • {msg.timestamp}</div>
                    <p style={{ fontSize: '0.9375rem', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  </div>
                ) : (
                  /* Assistant Response Bubble */
                  <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px 16px 16px 4px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bot size={16} color="#8b5cf6" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>AI Assistant</span>
                      </div>
                      
                      {/* Decision Badge */}
                      <span className={`status-badge ${msg.status.toLowerCase()} ${msg.injectionDetected ? 'injection' : ''}`}>
                        {msg.injectionDetected && <AlertTriangle size={12} />}
                        {msg.status}
                      </span>
                    </div>

                    {/* Customer-facing reply message */}
                    <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#f3f4f6' }}>
                      {msg.replyText}
                    </p>

                    {/* Injection Warning Box if detected */}
                    {msg.injectionDetected && (
                      <div style={{ marginTop: '0.875rem', background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.4)', borderRadius: '8px', padding: '0.625rem', fontSize: '0.75rem', color: '#f472b6' }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <ShieldCheck size={14} /> Prompt Injection Intercepted
                        </div>
                        <div style={{ marginTop: '0.25rem' }}>Detected attack pattern: <code>{msg.injectionPatterns}</code></div>
                      </div>
                    )}

                    {/* Policy & Reasoning Toggle */}
                    <div style={{ marginTop: '0.875rem', paddingTop: '0.625rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <button
                        onClick={() => toggleAuditLog(msg.id)}
                        style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Terminal size={12} />
                        {showAuditLogs[msg.id] ? 'Hide Policy Audit Trail' : 'View Policy & Reasoning Steps'}
                        {showAuditLogs[msg.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {showAuditLogs[msg.id] && msg.reasoningLogs && (
                        <div className="code-block" style={{ marginTop: '0.5rem', maxHeight: '160px' }}>
                          <div style={{ fontSize: '0.6875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Matched Rule: {msg.matchedRule}</div>
                          {msg.reasoningLogs.map((step, idx) => (
                            <div key={idx}>{step}</div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        {!hasApiKey && (
          <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '0.625rem 0.875rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={14} style={{ flexShrink: 0 }} />
            <span>Notice: Input API ENV keys in <code>.env</code> (<code>ANTHROPIC_API_KEY</code> / <code>OPENAI_API_KEY</code>) in order for live LLM responses to work. Local fallback engine is active.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <input
            type="text"
            value={customerMessage}
            onChange={(e) => setCustomerMessage(e.target.value)}
            placeholder="Type your refund request message or prompt injection test..."
            className="input-control"
            style={{ flex: 1 }}
            disabled={isSubmitting}
          />
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || !customerMessage.trim()}>
            <Send size={16} /> {isSubmitting ? 'Processing...' : 'Send'}
          </button>
        </form>

      </div>
    </div>
  );
}
