import React, { useState, useEffect } from 'react';
import Simulator from './components/Simulator';
import Menu from './components/Menu';
import Cart from './components/Cart';
import OrderStatus from './components/OrderStatus';
import ChefDashboard from './components/ChefDashboard';
import { BACKEND_URL, WS_URL } from './config';

export default function App() {
  const [view, setView] = useState('simulator'); // simulator, customer, chef, split-screen
  const [tableNumber, setTableNumber] = useState('5');
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  // Fetch Menu Items from SQLite database
  const fetchMenu = () => {
    fetch(`${BACKEND_URL}/api/menu`)
      .then(res => res.json())
      .then(data => setMenuItems(data))
      .catch(err => console.error('Error fetching menu database:', err));
  };

  // Initial load and routing
  useEffect(() => {
    fetchMenu();

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

  useEffect(() => {
    let socket;

    function connectSocket() {
      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        console.log('Successfully connected to WebSocket server');
      };

      socket.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);
          
          if (type === 'MENU_UPDATED') {
            fetchMenu(); // Re-fetch menu items instantly
          } else if (type === 'NEW_ORDER') {
            // Dispatch a custom event to notify Chef Dashboard instantly
            window.dispatchEvent(new CustomEvent('ws:new_order', { detail: data }));
          } else if (type === 'ORDER_STATUS_UPDATE') {
            // Dispatch a custom event to notify Order Status Tracker instantly
            window.dispatchEvent(new CustomEvent('ws:order_update', { detail: data }));
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 3s...');
        setTimeout(connectSocket, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket encountered error:', err);
        socket.close();
      };
    }

    connectSocket();

    return () => {
      if (socket) socket.close();
    };
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

  // RENDER CUSTOMER MENU VIEW
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
        
        <Menu menuItems={menuItems} cart={cart} onUpdateCart={handleUpdateCart} />
        
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

  // RENDER CHEF VIEW
  const renderChefView = () => {
    return (
      <>
        <header className="navbar glass-panel" style={{ borderRadius: '0 0 var(--radius-md) var(--radius-md)', margin: '0 0 1.5rem 0' }}>
          <div className="nav-brand">
            <span>👨‍🍳 Store Staff Dashboard</span>
          </div>
          <button onClick={() => setView('simulator')} className="btn-secondary" style={{ padding: '0.4rem 1rem', borderRadius: '20px' }}>
            🔌 Open Simulator
          </button>
        </header>
        <ChefDashboard menuItems={menuItems} />
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
            <span>👨‍🍳 Store Staff Dashboard (Admin View)</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>
              ⚡ Realtime WS Active
            </span>
          </div>
          <div className="split-pane-body">
            <ChefDashboard menuItems={menuItems} />
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
