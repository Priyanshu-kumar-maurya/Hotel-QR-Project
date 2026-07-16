import React, { useEffect, useState } from 'react';

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

export default function ChefDashboard({ menuItems }) {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('live'); // live, menu, reports
  
  // Menu Editor Form State
  const [editingItem, setEditingItem] = useState(null); // null if adding new
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Starters');
  const [price, setPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isSpicy, setIsSpicy] = useState(false);
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState('');
  const [submittingMenu, setSubmittingMenu] = useState(false);

  // Fetch all orders from backend
  const fetchOrders = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error('Error fetching orders:', err));
  };

  useEffect(() => {
    fetchOrders();

    // Listen to live WebSocket events via custom window events
    const handleNewOrder = (e) => {
      const newOrder = e.detail;
      setOrders(prev => [newOrder, ...prev]);
      playNewOrderAlert(); // Play chime instantly!
    };

    const handleOrderUpdate = (e) => {
      const updatedOrder = e.detail;
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    };

    window.addEventListener('ws:new_order', handleNewOrder);
    window.addEventListener('ws:order_update', handleOrderUpdate);

    return () => {
      window.removeEventListener('ws:new_order', handleNewOrder);
      window.removeEventListener('ws:order_update', handleOrderUpdate);
    };
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
        const data = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? data : o));
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // Manage Menu item actions (CRUD)
  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!name || !price) return;
    setSubmittingMenu(true);

    const bodyData = {
      name,
      category,
      price: Number(price),
      isVeg,
      isSpicy,
      desc,
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'
    };

    const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        // Clear fields
        resetMenuForm();
      } else {
        alert('Failed to save menu item.');
      }
    } catch (err) {
      console.error('Error saving menu item:', err);
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
    setDesc(item.desc);
    setImage(item.image);
  };

  const handleDeleteClick = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE'
      });
      if (!res.ok) alert('Failed to delete item.');
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const resetMenuForm = () => {
    setEditingItem(null);
    setName('');
    setCategory('Starters');
    setPrice('');
    setIsVeg(true);
    setIsSpicy(false);
    setDesc('');
    setImage('');
  };

  // Filter orders by status
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const completedOrders = orders.filter(o => o.status === 'completed');

  // Stats
  const totalSales = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const servedCount = completedOrders.length;
  const activeCount = pendingOrders.length + preparingOrders.length + readyOrders.length;

  const getElapsedTime = (isoString) => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    const elapsedMins = Math.floor(elapsedMs / 60000);
    if (elapsedMins < 1) return 'Just now';
    return `${elapsedMins}m ago`;
  };

  return (
    <div className="chef-container">
      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('live')} 
          className={`category-pill ${activeTab === 'live' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ⚡ Live Orders <span style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem' }}>{activeCount}</span>
        </button>
        <button 
          onClick={() => setActiveTab('menu')} 
          className={`category-pill ${activeTab === 'menu' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          📝 Menu Editor
        </button>
        <button 
          onClick={() => setActiveTab('reports')} 
          className={`category-pill ${activeTab === 'reports' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          📊 Sales Reports <span style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem' }}>{servedCount}</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB: LIVE KANBAN BOARD */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'live' && (
        <>
          <div className="chef-header-stats">
            <div className="stat-card glass-panel">
              <div className="stat-num">{activeCount}</div>
              <div className="stat-label">Active Orders</div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-num">{servedCount}</div>
              <div className="stat-label">Served Orders</div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-num">₹{totalSales}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="stat-card glass-panel" style={{ cursor: 'pointer' }} onClick={playNewOrderAlert}>
              <div className="stat-num" style={{ fontSize: '1.25rem', paddingTop: '0.4rem' }}>🔊 Bell Check</div>
              <div className="stat-label">Test Audio Chime</div>
            </div>
          </div>

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
                    <div className="order-card-cust">Customer: {order.customerName}</div>
                    <div className="order-card-items">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-card-item">
                          <span>{item.name}</span>
                          <span className="order-card-qty">&times; {item.qty}</span>
                        </div>
                      ))}
                    </div>
                    {order.specialInstructions && (
                      <div className="order-card-notes">Note: "{order.specialInstructions}"</div>
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
                    <div className="order-card-cust">Customer: {order.customerName}</div>
                    <div className="order-card-items">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-card-item">
                          <span>{item.name}</span>
                          <span className="order-card-qty">&times; {item.qty}</span>
                        </div>
                      ))}
                    </div>
                    {order.specialInstructions && (
                      <div className="order-card-notes">Note: "{order.specialInstructions}"</div>
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

            {/* READY COLUMN */}
            <div className="kanban-col col-ready">
              <div className="kanban-col-header">
                <h3 className="kanban-col-title">🔔 Ready to Serve</h3>
                <span className="kanban-col-count">{readyOrders.length}</span>
              </div>
              <div className="kanban-col-content">
                {readyOrders.map(order => (
                  <div key={order.id} className="order-card" style={{ borderLeft: '3px solid var(--success)' }}>
                    <div className="order-card-header">
                      <span className="order-card-table">Table {order.tableNumber}</span>
                      <span className="order-card-time">{getElapsedTime(order.updatedAt)}</span>
                    </div>
                    <div className="order-card-cust">Customer: {order.customerName}</div>
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
                    No orders ready.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: MENU MANAGER EDITOR */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'menu' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }}>
          {/* Add/Edit Form Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.2rem', fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              {editingItem ? '✏️ Edit Menu Item' : '➕ Add Menu Item'}
            </h3>
            
            <form onSubmit={handleSaveMenuItem}>
              <div className="form-group">
                <label className="form-label">Dish Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paneer Pasanda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    <option value="Starters">Starters</option>
                    <option value="Mains">Mains</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Price in Rs"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', margin: '1rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isVeg}
                    onChange={(e) => setIsVeg(e.target.checked)}
                    style={{ accentColor: 'var(--success)', width: '16px', height: '16px' }}
                  />
                  <span>🟢 Veg</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isSpicy}
                    onChange={(e) => setIsSpicy(e.target.checked)}
                    style={{ accentColor: 'var(--danger)', width: '16px', height: '16px' }}
                  />
                  <span>🌶️ Spicy</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Enter dish description..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="form-input"
                  style={{ height: '70px', resize: 'none' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  disabled={submittingMenu}
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.7rem' }}
                >
                  {submittingMenu ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
                {editingItem && (
                  <button
                    type="button"
                    onClick={resetMenuForm}
                    className="btn-secondary"
                    style={{ padding: '0.7rem' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Menu Items List Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem', maxHeight: '650px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              📜 Menu Items list
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {menuItems.map(item => (
                <div 
                  key={item.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.8rem', 
                    background: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '45px', height: '45px', borderRadius: '4px', objectFit: 'cover' }} 
                    />
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 600 }}>
                        {item.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.category})</span>
                      </h4>
                      <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem', marginTop: '0.1rem' }}>
                        <span style={{ color: item.isVeg ? '#10b981' : '#ef4444' }}>{item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>₹{item.price}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleEditClick(item)} 
                      style={{ color: 'var(--accent)', padding: '4px 8px', fontSize: '0.85rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '4px' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(item.id)} 
                      style={{ color: 'var(--danger)', padding: '4px 8px', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: SALES HISTORY & REPORTS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Revenue Summaries */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div className="stat-card glass-panel">
              <div className="stat-num">{servedCount}</div>
              <div className="stat-label">Total Served Orders</div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-num">₹{totalSales}</div>
              <div className="stat-label">Total Sales Volume</div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-num">
                ₹{servedCount > 0 ? Math.round(totalSales / servedCount) : 0}
              </div>
              <div className="stat-label">Average Ticket Size</div>
            </div>
          </div>

          {/* Past Orders List */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.2rem' }}>📜 Sales Ledger</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {completedOrders.map(order => (
                <div 
                  key={order.id} 
                  style={{ 
                    padding: '1.2rem', 
                    background: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent)' }}>Table {order.tableNumber}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getElapsedTime(order.updatedAt)}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                      Customer: **{order.customerName}**
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Items: {order.items.map(i => `${i.name} (${i.qty})`).join(', ')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>+ ₹{order.totalAmount}</div>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.1)', color: '#34d399', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                      Completed
                    </span>
                  </div>
                </div>
              ))}
              {completedOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No completed sales records yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
