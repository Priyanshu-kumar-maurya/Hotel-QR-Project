import React, { useState, useEffect } from 'react';
import Simulator from './components/Simulator';
import Menu from './components/Menu';
import Cart from './components/Cart';
import OrderStatus from './components/OrderStatus';
import ChefDashboard from './components/ChefDashboard';

export default function App() {
  const [view, setView] = useState('simulator'); // simulator, customer, chef, split-screen
  const [tableNumber, setTableNumber] = useState('5');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  // Parse initial route/query parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    const path = window.location.pathname;

    if (tableParam) {
      setTableNumber(tableParam);
      setView('customer');
    } else if (path === '/chef') {
      setView('chef');
    }
  }, []);

  // Update Cart Quantity
  const handleUpdateCart = (item, newQty) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.id !== item.id));
    } else {
      setCart(prev => {
        const existing = prev.find(i => i.id === item.id);
        if (existing) {
          return prev.map(i => i.id === item.id ? { ...i, qty: newQty } : i);
        } else {
          return [...prev, { ...item, qty: newQty }];
        }
      });
    }
  };

  const handleOrderPlaced = (order) => {
    setActiveOrder(order);
    setCart([]); // Clear cart
  };

  const handleClearOrder = () => {
    setActiveOrder(null);
  };

  const handleOpenCustomer = (num) => {
    window.open(`/?table=${num}`, '_blank');
  };

  const handleOpenChef = () => {
    window.open('/chef', '_blank');
  };

  const handleStartSplitScreen = (num) => {
    setTableNumber(num);
    setView('split-screen');
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // RENDER PURE CUSTOMER VIEW
  const renderCustomerView = () => {
    if (activeOrder) {
      return (
        <OrderStatus
          activeOrder={activeOrder}
          onClearOrder={handleClearOrder}
        />
      );
    }

    return (
      <>
        <header className="navbar glass-panel" style={{ borderRadius: '0 0 var(--radius-md) var(--radius-md)', margin: '0 0 1.5rem 0' }}>
          <div className="nav-brand">
            <span>🍽️ Table {tableNumber}</span>
          </div>
          <button className="badge-btn" onClick={() => setCartOpen(true)}>
            🛒 Cart <span className="badge-count">{totalCartCount}</span>
          </button>
        </header>
        
        <Menu cart={cart} onUpdateCart={handleUpdateCart} />
        
        <Cart
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          cart={cart}
          tableNumber={tableNumber}
          onUpdateCart={handleUpdateCart}
          onOrderPlaced={handleOrderPlaced}
        />
      </>
    );
  };

  // RENDER PURE CHEF DASHBOARD
  const renderChefView = () => {
    return (
      <>
        <header className="navbar glass-panel" style={{ borderRadius: '0 0 var(--radius-md) var(--radius-md)', margin: '0 0 1.5rem 0' }}>
          <div className="nav-brand">
            <span>👨‍🍳 Chef's Kitchen Dashboard</span>
          </div>
          <button onClick={() => setView('simulator')} className="btn-secondary" style={{ padding: '0.4rem 1rem', borderRadius: '20px' }}>
            🔌 Open Simulator
          </button>
        </header>
        <ChefDashboard />
      </>
    );
  };

  // MAIN ROUTING
  if (view === 'split-screen') {
    return (
      <div className="split-screen">
        {/* Left Customer Pane */}
        <div className="split-pane">
          <div className="split-pane-header">
            <span>📱 Table {tableNumber} Menu View (Scan Simulator)</span>
            <button 
              onClick={() => {
                setView('simulator');
                handleClearOrder();
              }}
              style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
            >
              Close
            </button>
          </div>
          <div className="split-pane-body">
            {renderCustomerView()}
          </div>
        </div>

        {/* Right Chef Pane */}
        <div className="split-pane">
          <div className="split-pane-header">
            <span>👨‍🍳 Kitchen Dashboard (Admin View)</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>
              🟢 Live Sync
            </span>
          </div>
          <div className="split-pane-body">
            <ChefDashboard />
          </div>
        </div>
      </div>
    );
  }

  if (view === 'customer') {
    return <div className="main-content">{renderCustomerView()}</div>;
  }

  if (view === 'chef') {
    return <div className="main-content">{renderChefView()}</div>;
  }

  // Fallback to Simulator Setup Landing Page
  return (
    <div className="main-content">
      <Simulator
        onStartSplitScreen={handleStartSplitScreen}
        onOpenCustomer={handleOpenCustomer}
        onOpenChef={handleOpenChef}
      />
    </div>
  );
}
