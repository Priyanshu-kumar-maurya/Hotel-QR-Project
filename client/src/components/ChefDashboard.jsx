import React, { useEffect, useState, useRef } from 'react';

// Rising sound chime for incoming chef orders
function playNewOrderAlert() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.2); // A5
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch (error) {
    console.error('Audio could not be played:', error);
  }
}

export default function ChefDashboard() {
  const [orders, setOrders] = useState([]);
  const previousOrderIds = useRef(new Set());

  // Fetch orders and check for new ones to chime
  const fetchOrders = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        
        // Detect new pending orders
        const pendingIds = data
          .filter(o => o.status === 'pending')
          .map(o => o.id);
        
        let hasNew = false;
        pendingIds.forEach(id => {
          if (!previousOrderIds.current.has(id)) {
            hasNew = true;
            previousOrderIds.current.add(id);
          }
        });
        
        if (hasNew && previousOrderIds.current.size > 0) {
          playNewOrderAlert();
        }

        // Clean up completed/removed order ids from the tracking set
        const currentIds = new Set(data.map(o => o.id));
        previousOrderIds.current.forEach(id => {
          if (!currentIds.has(id)) {
            previousOrderIds.current.delete(id);
          }
        });
      })
      .catch(err => console.error('Error fetching orders:', err));
  };

  useEffect(() => {
    // Initial fetch
    fetchOrders();

    // Setup periodic polling
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        // Optimistically update local state
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o));
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // Filter orders by column
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  // Stats Calculations
  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const completedCount = orders.filter(o => o.status === 'completed').length;
  const activeCount = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length;

  const getElapsedTime = (isoString) => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    const elapsedMins = Math.floor(elapsedMs / 60000);
    if (elapsedMins < 1) return 'Just now';
    return `${elapsedMins}m ago`;
  };

  return (
    <div className="chef-container">
      {/* Stats Bar */}
      <div className="chef-header-stats">
        <div className="stat-card glass-panel">
          <div className="stat-num">{activeCount}</div>
          <div className="stat-label">Active Orders</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-num">{completedCount}</div>
          <div className="stat-label">Served Orders</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-num">₹{totalSales}</div>
          <div className="stat-label">Today's Sales</div>
        </div>
        <div className="stat-card glass-panel" style={{ cursor: 'pointer' }} onClick={playNewOrderAlert}>
          <div className="stat-num" style={{ fontSize: '1.25rem', paddingTop: '0.4rem' }}>🔊 Bell Check</div>
          <div className="stat-label">Test Audio Alert</div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {/* PENDING COLUMN */}
        <div className="kanban-col col-pending">
          <div className="kanban-col-header">
            <h3 className="kanban-col-title">🕒 New Orders</h3>
            <span className="kanban-col-count">{pendingOrders.length}</span>
          </div>
          <div className="kanban-col-content">
            {pendingOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <span className="order-card-table">Table {order.tableNumber}</span>
                  <span className="order-card-time">{getElapsedTime(order.createdAt)}</span>
                </div>
                <div className="order-card-cust">
                  Customer: {order.customerName}
                </div>
                <div className="order-card-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-card-item">
                      <span>{item.name}</span>
                      <span className="order-card-qty">&times; {item.qty}</span>
                    </div>
                  ))}
                </div>
                {order.specialInstructions && (
                  <div className="order-card-notes">
                    Note: "{order.specialInstructions}"
                  </div>
                )}
                <div className="order-card-footer">
                  <span className="order-card-price">₹{order.totalAmount}</span>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="order-action-btn prepare-btn"
                  >
                    Accept & Cook 👨‍🍳
                  </button>
                </div>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                No new orders.
              </div>
            )}
          </div>
        </div>

        {/* PREPARING COLUMN */}
        <div className="kanban-col col-preparing">
          <div className="kanban-col-header">
            <h3 className="kanban-col-title">🍳 In Kitchen</h3>
            <span className="kanban-col-count">{preparingOrders.length}</span>
          </div>
          <div className="kanban-col-content">
            {preparingOrders.map(order => (
              <div key={order.id} className="order-card" style={{ borderLeft: '3px solid var(--info)' }}>
                <div className="order-card-header">
                  <span className="order-card-table">Table {order.tableNumber}</span>
                  <span className="order-card-time">{getElapsedTime(order.updatedAt)}</span>
                </div>
                <div className="order-card-cust">
                  Customer: {order.customerName}
                </div>
                <div className="order-card-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-card-item">
                      <span>{item.name}</span>
                      <span className="order-card-qty">&times; {item.qty}</span>
                    </div>
                  ))}
                </div>
                {order.specialInstructions && (
                  <div className="order-card-notes">
                    Note: "{order.specialInstructions}"
                  </div>
                )}
                <div className="order-card-footer">
                  <span className="order-card-price">₹{order.totalAmount}</span>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="order-action-btn ready-btn"
                  >
                    Mark as Ready ✅
                  </button>
                </div>
              </div>
            ))}
            {preparingOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                No cooking in progress.
              </div>
            )}
          </div>
        </div>

        {/* READY / COMPLETED COLUMN */}
        <div className="kanban-col col-ready">
          <div className="kanban-col-header">
            <h3 className="kanban-col-title">🔔 Ready to Serve</h3>
            <span className="kanban-col-count">{readyOrders.length}</span>
          </div>
          <div className="kanban-col-content">
            {readyOrders.map(order => (
              <div key={order.id} className="order-card" style={{ borderLeft: '3px solid var(--success)', background: 'rgba(16, 185, 129, 0.02)' }}>
                <div className="order-card-header">
                  <span className="order-card-table">Table {order.tableNumber}</span>
                  <span className="order-card-time">{getElapsedTime(order.updatedAt)}</span>
                </div>
                <div className="order-card-cust">
                  Customer: {order.customerName}
                </div>
                <div className="order-card-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-card-item">
                      <span>{item.name}</span>
                      <span className="order-card-qty">&times; {item.qty}</span>
                    </div>
                  ))}
                </div>
                <div className="order-card-footer" style={{ marginTop: '1rem' }}>
                  <span className="order-card-price">₹{order.totalAmount}</span>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="order-action-btn"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    Serve & Archive 📦
                  </button>
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                No orders ready for pickup.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
