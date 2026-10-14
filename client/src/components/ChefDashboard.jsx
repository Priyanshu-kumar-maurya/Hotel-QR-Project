import React, { useEffect, useState, useRef } from 'react';
import { BACKEND_URL } from '../config';

// Safe Web Audio chime for Kitchen Staff
function playStaffAudioAlert(type = 'order') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'service') {
      // 2 quick high beeps for waiter/water call
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Rising melodic chime for new incoming order
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (err) {
    console.warn('Audio alert blocked:', err);
  }
}

export default function ChefDashboard({ menuItems }) {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'menu', 'reports', 'qr-stand'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [serviceAlerts, setServiceAlerts] = useState([]);

  // Menu Editor state
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Starters');
  const [price, setPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isSpicy, setIsSpicy] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState('');
  const [submittingMenu, setSubmittingMenu] = useState(false);

  // Standee QR table selector
  const [standTable, setStandTable] = useState('5');

  // Fetch all orders from backend
  const fetchOrders = () => {
    fetch(`${BACKEND_URL}/api/orders`)
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error('Error fetching orders:', err));
  };

  useEffect(() => {
    fetchOrders();

    const handleNewOrder = (e) => {
      const newOrder = e.detail;
      setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
      if (soundEnabled) playStaffAudioAlert('order');
    };

    const handleOrderUpdate = (e) => {
      const updated = e.detail;
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    };

    const handleServiceCall = (e) => {
      const alertData = e.detail;
      setServiceAlerts(prev => [alertData, ...prev]);
      if (soundEnabled) playStaffAudioAlert('service');
    };

    window.addEventListener('ws:new_order', handleNewOrder);
    window.addEventListener('ws:order_update', handleOrderUpdate);
    window.addEventListener('ws:service_call', handleServiceCall);

    return () => {
      window.removeEventListener('ws:new_order', handleNewOrder);
      window.removeEventListener('ws:order_update', handleOrderUpdate);
      window.removeEventListener('ws:service_call', handleServiceCall);
    };
  }, [soundEnabled]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? data : o));
      }
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  // Toggle item in stock / sold out
  const toggleItemStock = async (itemId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/menu/${itemId}/toggle-stock`, {
        method: 'PATCH'
      });
      if (res.ok) {
        // Dispatched via WS automatically
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save / Edit Menu Item
  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!name || price === '') return;
    setSubmittingMenu(true);

    const bodyData = {
      name,
      category,
      price: Number(price),
      isVeg,
      isSpicy,
      isBestseller,
      desc,
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'
    };

    const url = editingItem ? `${BACKEND_URL}/api/menu/${editingItem.id}` : `${BACKEND_URL}/api/menu`;
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        resetMenuForm();
      } else {
        alert('Could not save dish.');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSubmittingMenu(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setIsVeg(item.isVeg);
    setIsSpicy(item.isSpicy);
    setIsBestseller(item.isBestseller || false);
    setDesc(item.desc || '');
    setImage(item.image || '');
  };

  const handleDeleteClick = async (itemId) => {
    if (!confirm('Are you sure you want to remove this dish from the menu?')) return;
    try {
      await fetch(`${BACKEND_URL}/api/menu/${itemId}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const resetMenuForm = () => {
    setEditingItem(null);
    setName('');
    setCategory('Starters');
    setPrice('');
    setIsVeg(true);
    setIsSpicy(false);
    setIsBestseller(false);
    setDesc('');
    setImage('');
  };

  // Order filters
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const completedOrders = orders.filter(o => o.status === 'completed');

  const activeCount = pendingOrders.length + preparingOrders.length + readyOrders.length;
  const servedCount = completedOrders.length;
  const totalSales = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const getElapsedTimeInfo = (isoString) => {
    const elapsedMins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
    if (elapsedMins < 1) return { text: 'Just now', alertLevel: 'normal' };
    if (elapsedMins < 8) return { text: `${elapsedMins}m ago`, alertLevel: 'normal' };
    if (elapsedMins < 15) return { text: `${elapsedMins}m ago`, alertLevel: 'warning' };
    return { text: `⚠️ ${elapsedMins}m ago`, alertLevel: 'urgent' };
  };

  return (
    <div className="chef-container">
      {/* Staff Dashboard Top Bar */}
      <div className="chef-top-bar">
        <div className="chef-tabs">
          <button 
            onClick={() => setActiveTab('live')} 
            className={`chef-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
          >
            <span>⚡ Kitchen KDS</span>
            <span style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 7px', borderRadius: '10px', fontSize: '0.75rem' }}>
              {activeCount}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('menu')} 
            className={`chef-tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          >
            <span>📋 Menu & Stock</span>
          </button>

          <button 
            onClick={() => setActiveTab('reports')} 
            className={`chef-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          >
            <span>📊 Sales Reports</span>
          </button>

          <button 
            onClick={() => setActiveTab('qr-stand')} 
            className={`chef-tab-btn ${activeTab === 'qr-stand' ? 'active' : ''}`}
          >
            <span>🖨️ Table QR Stand</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playStaffAudioAlert('order');
            }} 
            className="icon-btn"
            style={{ borderColor: soundEnabled ? 'var(--accent)' : 'var(--border-subtle)' }}
            title="Toggle Kitchen Sound Alerts"
          >
            {soundEnabled ? '🔔 Sound: ON' : '🔕 Sound: OFF'}
          </button>
        </div>
      </div>

      {/* Service Assistance Alert Banner */}
      {serviceAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {serviceAlerts.map((alert, idx) => (
            <div 
              key={idx}
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.2) 100%)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                animation: 'slide-up-bar 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🛎️</span>
                <div>
                  <strong style={{ color: 'var(--accent-light)' }}>Table {alert.tableNumber}</strong> requires assistance: 
                  <span style={{ textTransform: 'capitalize', fontWeight: 600, marginLeft: '0.3rem' }}>{alert.type}</span>
                  {alert.note && <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({alert.note})</span>}
                </div>
              </div>
              <button 
                onClick={() => setServiceAlerts(prev => prev.filter((_, i) => i !== idx))}
                className="icon-btn"
                style={{ fontSize: '0.75rem', padding: '3px 10px' }}
              >
                Dismiss ✓
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 1: KITCHEN DISPLAY SYSTEM (KDS KANBAN) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'live' && (
        <>
          <div className="chef-stats-grid">
            <div className="stat-box">
              <span className="stat-box-val">{activeCount}</span>
              <span className="stat-box-lbl">Active Orders</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-val">{servedCount}</span>
              <span className="stat-box-lbl">Orders Served</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-val">₹{totalSales}</span>
              <span className="stat-box-lbl">Today's Sales</span>
            </div>
            <div className="stat-box" style={{ cursor: 'pointer' }} onClick={() => playStaffAudioAlert('order')}>
              <span className="stat-box-val" style={{ fontSize: '1.4rem', paddingTop: '0.2rem' }}>🔊 Bell Test</span>
              <span className="stat-box-lbl">Test Chime</span>
            </div>
          </div>

          <div className="kanban-grid">
            {/* COLUMN 1: NEW INCOMING ORDERS */}
            <div className="kanban-column new-orders">
              <div className="kanban-header">
                <h3 className="kanban-col-title">
                  <span>🕒</span>
                  <span>New Orders</span>
                </h3>
                <span className="pill-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-light)' }}>
                  {pendingOrders.length}
                </span>
              </div>

              <div className="kanban-cards-wrap">
                {pendingOrders.map(order => {
                  const timeInfo = getElapsedTimeInfo(order.createdAt);
                  return (
                    <div key={order.id} className="kds-card">
                      <div className="kds-card-head">
                        <span className="kds-table-badge">Table {order.tableNumber}</span>
                        <span className={`kds-timer ${timeInfo.alertLevel}`}>
                          {timeInfo.text}
                        </span>
                      </div>

                      <div className="kds-card-cust">
                        Guest: <strong>{order.customerName}</strong>
                      </div>

                      <div className="kds-items-list">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="kds-item-row">
                            <span>
                              <span className="kds-item-qty">{item.qty}x</span>
                              {item.name}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>₹{item.price * item.qty}</span>
                          </div>
                        ))}
                      </div>

                      {order.specialInstructions && (
                        <div className="kds-note">
                          Note: "{order.specialInstructions}"
                        </div>
                      )}

                      <div className="kds-actions-row">
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          ₹{order.totalAmount}
                        </span>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="btn-kds-action cook"
                        >
                          Accept & Cook 🍳
                        </button>
                      </div>
                    </div>
                  );
                })}

                {pendingOrders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                    No new orders pending.
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: IN PREPARATION */}
            <div className="kanban-column cooking">
              <div className="kanban-header">
                <h3 className="kanban-col-title">
                  <span>🍳</span>
                  <span>Cooking</span>
                </h3>
                <span className="pill-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--info)' }}>
                  {preparingOrders.length}
                </span>
              </div>

              <div className="kanban-cards-wrap">
                {preparingOrders.map(order => {
                  const timeInfo = getElapsedTimeInfo(order.updatedAt);
                  return (
                    <div key={order.id} className="kds-card" style={{ borderLeft: '3px solid var(--info)' }}>
                      <div className="kds-card-head">
                        <span className="kds-table-badge">Table {order.tableNumber}</span>
                        <span className={`kds-timer ${timeInfo.alertLevel}`}>
                          {timeInfo.text}
                        </span>
                      </div>

                      <div className="kds-card-cust">
                        Guest: <strong>{order.customerName}</strong>
                      </div>

                      <div className="kds-items-list">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="kds-item-row">
                            <span>
                              <span className="kds-item-qty">{item.qty}x</span>
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.specialInstructions && (
                        <div className="kds-note">
                          Note: "{order.specialInstructions}"
                        </div>
                      )}

                      <div className="kds-actions-row">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="btn-kds-action ready"
                          style={{ width: '100%' }}
                        >
                          Mark Food Ready 🔔
                        </button>
                      </div>
                    </div>
                  );
                })}

                {preparingOrders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                    No food currently cooking.
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 3: READY TO SERVE */}
            <div className="kanban-column ready">
              <div className="kanban-header">
                <h3 className="kanban-col-title">
                  <span>🔔</span>
                  <span>Ready to Serve</span>
                </h3>
                <span className="pill-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-light)' }}>
                  {readyOrders.length}
                </span>
              </div>

              <div className="kanban-cards-wrap">
                {readyOrders.map(order => (
                  <div key={order.id} className="kds-card" style={{ borderLeft: '3px solid var(--success)' }}>
                    <div className="kds-card-head">
                      <span className="kds-table-badge">Table {order.tableNumber}</span>
                      <span className="pill-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success-light)' }}>
                        Ready
                      </span>
                    </div>

                    <div className="kds-card-cust">
                      Guest: <strong>{order.customerName}</strong>
                    </div>

                    <div className="kds-items-list">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="kds-item-row">
                          <span>
                            <span className="kds-item-qty">{item.qty}x</span>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="kds-actions-row" style={{ marginTop: '0.8rem' }}>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="btn-kds-action serve"
                        style={{ width: '100%' }}
                      >
                        Delivered & Clear 📦
                      </button>
                    </div>
                  </div>
                ))}

                {readyOrders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                    No orders waiting to be served.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: MENU MANAGER & LIVE STOCK CONTROL */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'menu' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '1.5rem' }}>
          {/* Add / Edit Form */}
          <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.25rem', fontFamily: 'var(--font-display)', fontSize: '1.2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              {editingItem ? '✏️ Edit Dish' : '➕ Add New Dish'}
            </h3>

            <form onSubmit={handleSaveMenuItem}>
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Dish Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tandoori Soya Chaap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="cart-input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="cart-input-field"
                    style={{ background: 'var(--bg-surface)' }}
                  >
                    <option value="Starters">Starters</option>
                    <option value="Mains">Mains</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="250"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="cart-input-field"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', margin: '0.8rem 0', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={isVeg}
                    onChange={(e) => setIsVeg(e.target.checked)}
                    style={{ accentColor: '#10b981', width: 16, height: 16 }}
                  />
                  <span>🟢 Veg</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={isSpicy}
                    onChange={(e) => setIsSpicy(e.target.checked)}
                    style={{ accentColor: '#ef4444', width: 16, height: 16 }}
                  />
                  <span>🌶️ Spicy</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={isBestseller}
                    onChange={(e) => setIsBestseller(e.target.checked)}
                    style={{ accentColor: '#f59e0b', width: 16, height: 16 }}
                  />
                  <span>⭐ Bestseller</span>
                </label>
              </div>

              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Description
                </label>
                <textarea
                  placeholder="Delicious dish with authentic flavors..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="cart-input-field"
                  style={{ height: '65px', resize: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="cart-input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  disabled={submittingMenu}
                  className="btn-kitchen-order"
                  style={{ flex: 1, padding: '0.7rem' }}
                >
                  {submittingMenu ? 'Saving...' : editingItem ? 'Save Changes' : '+ Add Dish'}
                </button>
                {editingItem && (
                  <button
                    type="button"
                    onClick={resetMenuForm}
                    className="icon-btn"
                    style={{ padding: '0.7rem 1.2rem' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Dishes List with Stock Toggle Switches */}
          <div className="glass-panel" style={{ padding: '1.5rem', maxHeight: '720px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📜 Menu Items ({menuItems.length})</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live Stock Sync</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {menuItems.map(item => {
                const inStock = item.isAvailable !== false;
                return (
                  <div 
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.85rem 1rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      opacity: inStock ? 1 : 0.65
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                      />
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                          {item.name}
                        </h4>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', marginTop: '0.2rem', alignItems: 'center' }}>
                          <span style={{ color: item.isVeg ? '#10b981' : '#ef4444' }}>
                            {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>•</span>
                          <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>₹{item.price}</span>
                          <span style={{ color: 'var(--text-muted)' }}>({item.category})</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      {/* In Stock / Sold Out Toggle Button */}
                      <button
                        onClick={() => toggleItemStock(item.id)}
                        className="icon-btn"
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          background: inStock ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                          color: inStock ? 'var(--success-light)' : 'var(--danger)',
                          borderColor: inStock ? 'var(--success)' : 'var(--danger)'
                        }}
                      >
                        {inStock ? '✓ In Stock' : '✕ Sold Out'}
                      </button>

                      <button
                        onClick={() => handleEditClick(item)}
                        className="icon-btn"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="icon-btn"
                        style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--danger)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: SALES REPORTS & ANALYTICS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="chef-stats-grid">
            <div className="stat-box">
              <span className="stat-box-val">{servedCount}</span>
              <span className="stat-box-lbl">Total Completed Orders</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-val">₹{totalSales}</span>
              <span className="stat-box-lbl">Total Gross Revenue</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-val">
                ₹{servedCount > 0 ? Math.round(totalSales / servedCount) : 0}
              </span>
              <span className="stat-box-lbl">Average Ticket Size</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontFamily: 'var(--font-display)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📜 Completed Sales Ledger</span>
              <button 
                onClick={() => window.print()} 
                className="icon-btn"
                style={{ fontSize: '0.8rem', padding: '4px 12px' }}
              >
                🖨️ Print Ledger
              </button>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {completedOrders.map(order => (
                <div 
                  key={order.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--accent-light)', fontSize: '1rem' }}>
                        Table {order.tableNumber}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(order.updatedAt).toLocaleTimeString()}
                      </span>
                      <span className="pill-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-light)', fontSize: '0.7rem' }}>
                        COMPLETED
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                      Guest: <strong>{order.customerName}</strong>
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Items: {order.items.map(i => `${i.name} (×${i.qty})`).join(', ')}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success-light)' }}>
                      + ₹{order.totalAmount}
                    </div>
                  </div>
                </div>
              ))}

              {completedOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                  No completed sales records yet for today.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: TABLE QR STANDEE PRINTABLE GENERATOR */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'qr-stand' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontWeight: 700 }}>Select Table Number:</label>
            <input
              type="number"
              min="1"
              max="50"
              value={standTable}
              onChange={(e) => setStandTable(e.target.value)}
              className="cart-input-field"
              style={{ width: '80px', textAlign: 'center', margin: 0, fontWeight: 800 }}
            />
            <button onClick={() => window.print()} className="icon-btn" style={{ borderColor: 'var(--accent)', color: 'var(--accent-light)' }}>
              🖨️ Print Standee Card
            </button>
          </div>

          {/* Luxury Standee Card Preview */}
          <div className="qr-standee-preview printable-area">
            <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>🍽️</div>
            <h2 className="qr-standee-rest">The Grand Gourmet</h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Smart Digital Menu & Ordering
            </p>

            <div className="qr-standee-table-box">
              TABLE NO. {standTable}
            </div>

            <div className="qr-standee-code-wrap">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0f0e0c&data=${encodeURIComponent(
                  `${window.location.origin}/?table=${standTable}`
                )}`}
                alt={`Table ${standTable} QR`}
                style={{ width: 180, height: 180, display: 'block' }}
              />
            </div>

            <p className="qr-standee-inst">
              📱 <strong>Scan with Phone Camera</strong><br />
              Browse Menu • Order Food • Instant Kitchen Sync
            </p>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.8rem', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#94a3b8' }}>
              No App Download Required • Free High-Speed Dining Wi-Fi
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
