import React, { useEffect, useState } from 'react';

// Web Audio API Synthesizer for notifications
export function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Low bell (G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);
    
    // High bell (C6) slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.15); // C6
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 1.0);
  } catch (error) {
    console.error('Audio could not be initialized:', error);
  }
}

export default function OrderStatus({ activeOrder, onClearOrder }) {
  const [order, setOrder] = useState(activeOrder);
  const [hasChimed, setHasChimed] = useState(false);

  // Poll server for order updates
  useEffect(() => {
    setOrder(activeOrder);
    setHasChimed(false);
    
    if (!activeOrder?.id) return;

    const pollInterval = setInterval(() => {
      fetch(`/api/orders`)
        .then(res => res.json())
        .then(orders => {
          const updated = orders.find(o => o.id === activeOrder.id);
          if (updated) {
            setOrder(updated);
            
            // Check if status transitioned to ready and we haven't chimed yet
            if (updated.status === 'ready' && !hasChimed) {
              playChimeSound();
              setHasChimed(true);
            }
          }
        })
        .catch(err => console.error('Error polling order status:', err));
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [activeOrder, hasChimed]);

  const getStepProgress = (status) => {
    switch (status) {
      case 'pending': return '15%';
      case 'preparing': return '50%';
      case 'ready': return '100%';
      default: return '15%';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending':
        return 'Waiting for Kitchen to confirm your order...';
      case 'preparing':
        return 'Chef is cooking your fresh meal right now!';
      case 'ready':
        return 'Your food is cooked and ready for pick-up / service!';
      default:
        return 'Placing your order...';
    }
  };

  return (
    <div className="status-tracker-container glass-panel">
      <div className="status-header">
        <h2>Order Status Tracker</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Order ID: <code style={{ color: 'var(--accent)' }}>{order?.id}</code>
        </p>
        <span className={`status-badge ${order?.status}`}>
          {order?.status === 'pending' && '🕒 Placed'}
          {order?.status === 'preparing' && '👨‍🍳 Preparing'}
          {order?.status === 'ready' && '✅ Ready'}
        </span>
      </div>

      <p style={{ fontSize: '1.05rem', fontWeight: 500, margin: '1rem 0' }}>
        {getStatusMessage(order?.status)}
      </p>

      {/* Progress Timeline Bar */}
      <div className="progress-steps">
        <div className="progress-line"></div>
        <div 
          className="progress-line-fill" 
          style={{ width: getStepProgress(order?.status) }}
        ></div>

        <div className={`step-node ${order?.status !== 'new' ? 'completed' : ''}`}>
          1
          <div className="step-label">Order Sent</div>
        </div>
        
        <div className={`step-node ${
          order?.status === 'preparing' ? 'active' : 
          order?.status === 'ready' ? 'completed' : ''
        }`}>
          2
          <div className="step-label">Preparing</div>
        </div>
        
        <div className={`step-node ${order?.status === 'ready' ? 'active completed' : ''}`}>
          3
          <div className="step-label">Food Ready</div>
        </div>
      </div>

      {order?.status === 'ready' && (
        <div className="ready-alert-banner" style={{ marginTop: '2.5rem' }}>
          <div className="ready-alert-text">
            🔔 Food is Ready! Please enjoy your meal.
          </div>
        </div>
      )}

      <div className="status-details">
        <h4 className="status-details-title">Order Items</h4>
        {order?.items.map((item, idx) => (
          <div key={idx} className="status-item-row">
            <span>{item.qty}x {item.name}</span>
            <span style={{ color: 'var(--text-secondary)' }}>₹{item.price * item.qty}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '0.8rem', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>Total Paid/Due:</span>
          <span style={{ color: 'var(--accent)' }}>₹{order?.totalAmount}</span>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button onClick={onClearOrder} className="btn-secondary" style={{ width: '100%' }}>
          ← Order Something Else / Go Back
        </button>
      </div>
    </div>
  );
}
