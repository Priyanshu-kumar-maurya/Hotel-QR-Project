import React, { useState, useEffect } from 'react';
import Simulator from './components/Simulator';
import Menu from './components/Menu';
import Cart from './components/Cart';
import OrderStatus from './components/OrderStatus';
import ChefDashboard from './components/ChefDashboard';
import { BACKEND_URL, WS_URL } from './config';

export default function App() {
  const [view, setView] = useState('simulator'); // 'simulator', 'customer', 'chef', 'split-screen'
  const [tableNumber, setTableNumber] = useState('5');
  const [menuItems, setMenuItems] = useState([]);
  
  // Persistent Cart state
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('quickdine_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);

  // Persistent Active Order state
  const [activeOrder, setActiveOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('quickdine_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('quickdine_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn(e);
    }
  }, [cart]);

  // Save activeOrder to localStorage
  useEffect(() => {
    try {
      if (activeOrder) {
        localStorage.setItem('quickdine_active_order', JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem('quickdine_active_order');
      }
    } catch (e) {
      console.warn(e);
    }
  }, [activeOrder]);

  // Fetch Menu Items
  const fetchMenu = () => {
    fetch(`${BACKEND_URL}/api/menu`)
      .then(res => res.json())
      .then(data => setMenuItems(data))
      .catch(err => console.error('Error fetching menu:', err));
  };

  // Initial load and URL routing
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

    // Verify active order status on boot
    const savedOrderJson = localStorage.getItem('quickdine_active_order');
    if (savedOrderJson) {
      try {
        const saved = JSON.parse(savedOrderJson);
        if (saved?.id) {
          fetch(`${BACKEND_URL}/api/orders/${saved.id}`)
            .then(res => {
              if (res.ok) return res.json();
              throw new Error('Order expired');
            })
            .then(freshOrder => {
              setActiveOrder(freshOrder);
            })
            .catch(() => {
              localStorage.removeItem('quickdine_active_order');
              setActiveOrder(null);
            });
        }
      } catch (e) {
        localStorage.removeItem('quickdine_active_order');
      }
    }
  }, []);

  // WebSocket Connection with Heartbeat & Auto-Reconnect
  useEffect(() => {
    let socket;
    let reconnectTimer;
    let pingInterval;

    function connectSocket() {
      try {
        socket = new WebSocket(WS_URL);

        socket.onopen = () => {
          console.log('⚡ Connected to QuickDine WebSocket');
          // Client ping keep-alive every 20s
          pingInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'PING' }));
            }
          }, 20000);
        };

        socket.onmessage = (event) => {
          try {
            const { type, data } = JSON.parse(event.data);
            if (type === 'MENU_UPDATED') {
              fetchMenu();
            } else if (type === 'NEW_ORDER') {
              window.dispatchEvent(new CustomEvent('ws:new_order', { detail: data }));
            } else if (type === 'ORDER_STATUS_UPDATE') {
              window.dispatchEvent(new CustomEvent('ws:order_update', { detail: data }));
              // If this update matches our active order, update state
              setActiveOrder(prev => (prev && prev.id === data.id ? data : prev));
            } else if (type === 'SERVICE_CALL') {
              window.dispatchEvent(new CustomEvent('ws:service_call', { detail: data }));
            }
          } catch (err) {
            console.warn('WS message error:', err);
          }
        };

        socket.onclose = () => {
          clearInterval(pingInterval);
          reconnectTimer = setTimeout(connectSocket, 3000);
        };

        socket.onerror = () => {
          socket.close();
        };
      } catch (err) {
        console.warn('WebSocket connect error:', err);
        reconnectTimer = setTimeout(connectSocket, 3000);
      }
    }

    connectSocket();

    return () => {
      clearInterval(pingInterval);
      clearTimeout(reconnectTimer);
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
    setCart([]); // Clear cart after successful placement
    localStorage.removeItem('quickdine_cart');
  };

  const handleClearOrder = () => {
    setActiveOrder(null);
    localStorage.removeItem('quickdine_active_order');
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

  // Quick Service Request helper
  const handleQuickServiceRequest = async (type = 'waiter') => {
    try {
      await fetch(`${BACKEND_URL}/api/service-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, type, note: 'Quick assistance button' })
      });
      alert(`Service notified! Waiter is on the way to Table ${tableNumber}.`);
    } catch {
      alert('Could not notify staff.');
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // ----------------------------------------------------
  // RENDER CUSTOMER VIEW
  // ----------------------------------------------------
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
        {/* Modern Navbar */}
        <header className="modern-navbar">
          <div className="nav-brand-group">
            <span className="nav-table-badge">
              📍 Table {tableNumber}
            </span>
            <span className="nav-rest-name">The Grand Gourmet</span>
          </div>

          <div className="nav-actions-group">
            <button 
              className="icon-btn cart-trigger"
              onClick={() => setCartOpen(true)}
              aria-label="Open tray"
            >
              <span>🛒</span>
              <span>Tray</span>
              {totalCartCount > 0 && (
                <span className="cart-count-pill">{totalCartCount}</span>
              )}
            </button>
          </div>
        </header>

        {/* Hero Restaurant Banner */}
        <div className="hero-banner">
          <div className="hero-header-row">
            <div>
              <h1 className="hero-title">Welcome to Table {tableNumber}</h1>
              <p className="hero-subtitle">
                <span>Select your meal, customize & order directly from your mobile.</span>
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
            <span className="hero-tag gold">⚡ Instant Kitchen Sync</span>
            <span className="hero-tag">🍽️ Table QR Service</span>
            <span className="hero-tag">💬 WhatsApp Receipts</span>
          </div>
        </div>

        {/* Menu Cards */}
        <Menu 
          menuItems={menuItems} 
          cart={cart} 
          onUpdateCart={handleUpdateCart} 
        />

        {/* Floating Quick Service Button */}
        <button 
          onClick={() => handleQuickServiceRequest('waiter')}
          className="service-call-btn"
          title="Call Waiter to Table"
        >
          <span>🛎️</span>
          <span>Call Waiter</span>
        </button>

        {/* Floating Sticky Bottom Cart Bar (Swiggy / Zomato style) */}
        {totalCartCount > 0 && !cartOpen && (
          <div 
            className="floating-cart-bar"
            onClick={() => setCartOpen(true)}
          >
            <div className="floating-cart-info">
              <span className="floating-cart-badge">{totalCartCount}</span>
              <div>
                <div className="floating-cart-total">₹{totalCartPrice}</div>
                <div className="floating-cart-subtext">{totalCartCount} item(s) selected</div>
              </div>
            </div>

            <div className="floating-cart-cta">
              <span>View Order</span>
              <span>→</span>
            </div>
          </div>
        )}

        {/* Slide-Up / Drawer Cart */}
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

  // ----------------------------------------------------
  // RENDER CHEF VIEW
  // ----------------------------------------------------
  const renderChefView = () => {
    return (
      <>
        <header className="modern-navbar" style={{ marginBottom: '1.25rem' }}>
          <div className="nav-brand-group">
            <span className="nav-table-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'var(--info)', color: 'var(--info)' }}>
              👨‍🍳 Kitchen Staff POS
            </span>
            <span className="nav-rest-name">The Grand Gourmet</span>
          </div>

          <div className="nav-actions-group">
            <button 
              onClick={() => setView('simulator')} 
              className="icon-btn"
              style={{ padding: '0.45rem 1rem' }}
            >
              ← Back to Simulator
            </button>
          </div>
        </header>

        <ChefDashboard menuItems={menuItems} />
      </>
    );
  };

  // ----------------------------------------------------
  // MAIN ROUTING
  // ----------------------------------------------------

  // SPLIT SCREEN DEMO (Simulated Phone + Staff POS)
  if (view === 'split-screen') {
    return (
      <div className="split-screen-wrapper">
        {/* Left: Mobile Phone Mockup Frame */}
        <div className="sim-phone-frame">
          <div className="sim-phone-notch">
            <div className="sim-phone-notch-bar"></div>
          </div>
          <div className="sim-phone-content">
            {renderCustomerView()}
          </div>
        </div>

        {/* Right: Kitchen Admin POS */}
        <div className="sim-admin-frame">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.25rem' }}>👨‍🍳</span>
              <strong style={{ fontSize: '1.1rem' }}>Kitchen Staff POS / Admin Live View</strong>
              <span className="pill-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-light)', fontSize: '0.72rem' }}>
                ⚡ WebSocket Realtime Active
              </span>
            </div>

            <button
              onClick={() => {
                setView('simulator');
                handleClearOrder();
              }}
              className="icon-btn"
              style={{ fontSize: '0.8rem', padding: '4px 10px' }}
            >
              Exit Split-Screen ✕
            </button>
          </div>

          <ChefDashboard menuItems={menuItems} />
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
