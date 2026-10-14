import React, { useEffect, useState, useRef } from 'react';
import { BACKEND_URL } from '../config';

// Safe Web Audio chime synthesizer
export function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Bell G5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.setValueAtTime(783.99, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);

    // Bell C6 slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 1.1);
  } catch (error) {
    console.warn('Audio could not play:', error);
  }
}

export default function OrderStatus({ activeOrder, onClearOrder, onCallService }) {
  const [order, setOrder] = useState(activeOrder);
  const [callingService, setCallingService] = useState(false);
  const [serviceMessage, setServiceMessage] = useState('');
  const soundPlayedRef = useRef(false);

  // Sync state and fetch latest from server
  const syncOrderState = () => {
    if (!activeOrder?.id) return;
    fetch(`${BACKEND_URL}/api/orders/${activeOrder.id}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Order not found');
      })
      .then(data => {
        setOrder(data);
        if (data.status === 'ready' && !soundPlayedRef.current) {
          playChimeSound();
          soundPlayedRef.current = true;
        }
      })
      .catch(err => console.warn('Could not sync order:', err));
  };

  useEffect(() => {
    setOrder(activeOrder);
    syncOrderState();

    // Listen to real-time WebSocket updates via custom window event
    const handleWsOrderUpdate = (e) => {
      const updatedOrder = e.detail;
      if (updatedOrder && updatedOrder.id === activeOrder.id) {
        setOrder(updatedOrder);

        if (updatedOrder.status === 'ready' && !soundPlayedRef.current) {
          playChimeSound();
          soundPlayedRef.current = true;
        }
      }
    };

    window.addEventListener('ws:order_update', handleWsOrderUpdate);

    // Re-sync when mobile phone unlocks or browser tab regains focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncOrderState();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', syncOrderState);

    // Gentle polling fallback every 8s if still pending or preparing
    const interval = setInterval(() => {
      if (order?.status === 'pending' || order?.status === 'preparing') {
        syncOrderState();
      }
    }, 8000);

    return () => {
      window.removeEventListener('ws:order_update', handleWsOrderUpdate);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', syncOrderState);
      clearInterval(interval);
    };
  }, [activeOrder?.id]);

  const requestService = async (type = 'waiter') => {
    setCallingService(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/service-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: order?.tableNumber,
          type,
          note: `Requested from Order #${order?.id?.slice(-5)}`
        })
      });
      if (res.ok) {
        setServiceMessage(`Staff notified! Someone is coming to Table ${order?.tableNumber}.`);
        setTimeout(() => setServiceMessage(''), 6000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCallingService(false);
    }
  };

  const getStepStatus = () => {
    const s = order?.status;
    if (s === 'pending') return { step: 1, width: '18%', msg: 'Order received! Kitchen is preparing your ticket.' };
    if (s === 'preparing') return { step: 2, width: '50%', msg: 'Chef is cooking your fresh dishes right now!' };
    if (s === 'ready') return { step: 3, width: '85%', msg: 'Your food is cooked and ready for pickup/serving!' };
    if (s === 'completed') return { step: 4, width: '100%', msg: 'Order served. Thank you for dining with us!' };
    return { step: 1, width: '18%', msg: 'Processing your order...' };
  };

  const statusInfo = getStepStatus();

  return (
    <div className="tracker-card glass-panel-glow">
      {/* Header */}
      <div className="tracker-header">
        <span className="nav-table-badge">
          📍 Table {order?.tableNumber}
        </span>
        <h2 className="tracker-title" style={{ marginTop: '0.6rem' }}>
          Live Order Status
        </h2>
        <p className="tracker-order-id">
          Order ID: <code>#{order?.id?.slice(-8).toUpperCase()}</code>
        </p>

        {/* Hero Status Pill */}
        <div className={`status-hero-pill ${order?.status}`}>
          {order?.status === 'pending' && '🕒 Order Placed (Waiting for Kitchen)'}
          {order?.status === 'preparing' && '🍳 Chef is Cooking'}
          {order?.status === 'ready' && '🔔 Food is Ready!'}
          {order?.status === 'completed' && '✨ Order Served'}
        </div>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.8rem' }}>
          {statusInfo.msg}
        </p>
      </div>

      {/* Stepper Timeline */}
      <div className="tracker-stepper">
        <div className="stepper-rail"></div>
        <div className="stepper-fill" style={{ width: statusInfo.width }}></div>

        {/* Step 1 */}
        <div className={`step-node-col ${statusInfo.step >= 1 ? 'active' : ''}`}>
          <div className={`step-circle ${statusInfo.step > 1 ? 'done' : statusInfo.step === 1 ? 'active' : ''}`}>
            {statusInfo.step > 1 ? '✓' : '1'}
          </div>
          <span className="step-caption">Confirmed</span>
        </div>

        {/* Step 2 */}
        <div className={`step-node-col ${statusInfo.step >= 2 ? 'active' : ''}`}>
          <div className={`step-circle ${statusInfo.step > 2 ? 'done' : statusInfo.step === 2 ? 'active' : ''}`}>
            {statusInfo.step > 2 ? '✓' : '2'}
          </div>
          <span className="step-caption">Cooking</span>
        </div>

        {/* Step 3 */}
        <div className={`step-node-col ${statusInfo.step >= 3 ? 'active' : ''}`}>
          <div className={`step-circle ${statusInfo.step > 3 ? 'done' : statusInfo.step === 3 ? 'active' : ''}`}>
            {statusInfo.step > 3 ? '✓' : '3'}
          </div>
          <span className="step-caption">Food Ready</span>
        </div>

        {/* Step 4 */}
        <div className={`step-node-col ${statusInfo.step >= 4 ? 'active' : ''}`}>
          <div className={`step-circle ${statusInfo.step === 4 ? 'done' : ''}`}>
            4
          </div>
          <span className="step-caption">Served</span>
        </div>
      </div>

      {/* Food Ready Alert */}
      {order?.status === 'ready' && (
        <div className="ready-celebration-box">
          <div className="ready-celebration-title">
            <span>🔔</span>
            <span>Food is Ready to Serve!</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            The chef has completed your dishes. Please collect your order or our waitstaff will serve it at Table {order?.tableNumber}.
          </p>
        </div>
      )}

      {/* Service Assistance Alert Banner */}
      {serviceMessage && (
        <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid var(--info)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-sm)', color: 'var(--info)', fontSize: '0.88rem', fontWeight: 600, marginBottom: '1.25rem', textAlign: 'center' }}>
          🔔 {serviceMessage}
        </div>
      )}

      {/* Digital Receipt Breakdown */}
      <div className="receipt-box">
        <h4 className="receipt-title">Order Summary ({order?.items?.length} Items)</h4>
        
        {order?.items?.map((item, idx) => (
          <div key={idx} className="receipt-row">
            <span>
              <strong style={{ color: 'var(--accent-light)' }}>{item.qty}x</strong> {item.name}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              ₹{item.price * item.qty}
            </span>
          </div>
        ))}

        <div className="receipt-divider"></div>

        {order?.subtotal && (
          <div className="receipt-row" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>
        )}
        {order?.tax !== undefined && (
          <div className="receipt-row" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>GST (5%)</span>
            <span>₹{order.tax}</span>
          </div>
        )}

        <div className="receipt-row" style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: '0.4rem' }}>
          <span>Grand Total</span>
          <span style={{ color: 'var(--accent-light)' }}>₹{order?.totalAmount}</span>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <button 
            onClick={() => requestService('water')}
            disabled={callingService}
            className="icon-btn"
            style={{ justifyContent: 'center', padding: '0.65rem' }}
          >
            💧 Request Water
          </button>
          <button 
            onClick={() => requestService('waiter')}
            disabled={callingService}
            className="icon-btn"
            style={{ justifyContent: 'center', padding: '0.65rem' }}
          >
            🛎️ Call Waiter
          </button>
        </div>

        <button 
          onClick={onClearOrder}
          className="btn-kitchen-order"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
        >
          ➕ Order More Dishes / Go to Menu
        </button>
      </div>
    </div>
  );
}
