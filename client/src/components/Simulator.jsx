import React, { useState, useEffect } from 'react';

export default function Simulator({ onStartSplitScreen, onOpenCustomer, onOpenChef }) {
  const [tableNumber, setTableNumber] = useState('5');
  const [localIp, setLocalIp] = useState('127.0.0.1');
  const [port, setPort] = useState('5000');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ip')
      .then(res => res.json())
      .then(data => {
        setLocalIp(data.ip);
        setPort(data.port);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching IP:', err);
        setLoading(false);
      });
  }, []);

  const getCustomerUrl = (ipAddress) => {
    return `http://${ipAddress}:${port}/?table=${tableNumber}`;
  };

  const getChefUrl = () => {
    return `http://localhost:${port}/chef`;
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0f0e0c&data=${encodeURIComponent(
    getCustomerUrl(localIp)
  )}`;

  return (
    <div className="simulator-container glass-panel">
      <h1 className="simulator-title">QuickDine Simulator</h1>
      <p className="simulator-subtitle">Demo Setup for Hotel QR Table-Ordering System</p>

      <div className="form-group" style={{ maxWidth: '300px', margin: '0 auto 2rem auto' }}>
        <label className="form-label">Table Number (Mese ka Number)</label>
        <input
          type="number"
          min="1"
          max="50"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          className="form-input"
          style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}
        />
      </div>

      <div className="qr-section">
        <p className="form-label" style={{ textAlign: 'center' }}>
          Scan QR Code using Mobile Phone (Same Wi-Fi Network):
        </p>
        <div className="qr-frame">
          <img
            src={qrCodeUrl}
            alt={`QR Code for Table ${tableNumber}`}
            style={{ width: '200px', height: '200px', display: 'block' }}
          />
        </div>
        <div className="qr-ip-notice">
          <span>🔗</span>
          <code>{getCustomerUrl(localIp)}</code>
        </div>
      </div>

      <div className="sim-actions" style={{ maxWidth: '400px', margin: '2rem auto 0 auto' }}>
        <button
          onClick={() => onStartSplitScreen(tableNumber)}
          className="btn-primary"
        >
          🖥️ Split Screen Demo (Customer + Chef)
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
          <button
            onClick={() => onOpenCustomer(tableNumber)}
            className="btn-secondary"
          >
            📱 Customer Menu View
          </button>
          <button
            onClick={() => onOpenChef()}
            className="btn-secondary"
          >
            👨‍🍳 Chef Dashboard
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', textAlign: 'left' }}>
        <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>
          How to test this demo?
        </h4>
        <ol style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Select a table number (e.g. 5) above.</li>
          <li>Click **Split Screen Demo** to open customer and chef dashboards side-by-side in this browser tab.</li>
          <li>Or scan the QR code above with your mobile phone (ensure phone is on same Wi-Fi) to view the menu on your phone, then order!</li>
        </ol>
      </div>
    </div>
  );
}
