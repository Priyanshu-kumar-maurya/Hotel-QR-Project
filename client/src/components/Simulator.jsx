import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../config';

export default function Simulator({ onStartSplitScreen, onOpenCustomer, onOpenChef }) {
  const [tableNumber, setTableNumber] = useState('5');
  const [localIp, setLocalIp] = useState('127.0.0.1');
  const [port, setPort] = useState('5000');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/ip`)
      .then(res => res.json())
      .then(data => {
        setLocalIp(data.ip);
        setPort(data.port);
      })
      .catch(err => console.warn('IP fetch error:', err));
  }, []);

  const getCustomerUrl = (ipAddress) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${ipAddress}:${port}/?table=${tableNumber}`;
    }
    return `${window.location.origin}/?table=${tableNumber}`;
  };

  const currentCustomerUrl = getCustomerUrl(localIp);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=0f0e0c&data=${encodeURIComponent(
    currentCustomerUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentCustomerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '640px', margin: '2rem auto', padding: '2.5rem 2rem', textAlign: 'center' }}>
      {/* Brand Header */}
      <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>🍽️</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
        QuickDine Pro
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
        Modern QR Table Ordering, Instant Kitchen KDS & WhatsApp Sync
      </p>

      {/* Table Selector */}
      <div style={{ maxWidth: '320px', margin: '0 auto 1.75rem auto' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
          Table Number (Mese ka Number)
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          {['1', '3', '5', '8', '12'].map(num => (
            <button
              key={num}
              onClick={() => setTableNumber(num)}
              className="icon-btn"
              style={{
                borderColor: tableNumber === num ? 'var(--accent)' : 'var(--border-subtle)',
                background: tableNumber === num ? 'var(--accent)' : 'var(--bg-card)',
                color: tableNumber === num ? 'var(--text-inverse)' : 'var(--text-primary)',
                fontWeight: 800,
                width: '42px',
                height: '42px',
                padding: 0
              }}
            >
              {num}
            </button>
          ))}
          <input
            type="number"
            min="1"
            max="99"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="cart-input-field"
            style={{ width: '60px', textAlign: 'center', margin: 0, fontWeight: 800 }}
          />
        </div>
      </div>

      {/* QR Code Presentation */}
      <div style={{ margin: '1.5rem 0' }}>
        <div 
          style={{ 
            background: 'white', 
            padding: '1.25rem', 
            borderRadius: '20px', 
            display: 'inline-block',
            boxShadow: '0 8px 30px var(--accent-glow)'
          }}
        >
          <img 
            src={qrCodeUrl} 
            alt={`QR Code for Table ${tableNumber}`} 
            style={{ width: '200px', height: '200px', display: 'block' }} 
          />
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <div 
            onClick={handleCopyLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
            title="Click to copy link"
          >
            <span>🔗</span>
            <code style={{ color: 'var(--accent-light)' }}>{currentCustomerUrl}</code>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '10px' }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '420px', margin: '2rem auto 0 auto' }}>
        <button
          onClick={() => onStartSplitScreen(tableNumber)}
          className="btn-kitchen-order"
          style={{ padding: '0.95rem' }}
        >
          <span>🖥️</span>
          <span>Open Split-Screen Interactive Demo</span>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            onClick={() => onOpenCustomer(tableNumber)}
            className="icon-btn"
            style={{ justifyContent: 'center', padding: '0.75rem' }}
          >
            📱 Customer View
          </button>

          <button
            onClick={() => onOpenChef()}
            className="icon-btn"
            style={{ justifyContent: 'center', padding: '0.75rem' }}
          >
            👨‍🍳 Kitchen Staff POS
          </button>
        </div>
      </div>

      {/* Explanatory notes */}
      <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <h4 style={{ color: 'var(--accent-light)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          ✨ Quick Demonstration Tips:
        </h4>
        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <li>
            <strong>Split Screen Mode</strong>: Opens both Customer Phone & Kitchen Staff dashboards side-by-side in real-time.
          </li>
          <li>
            <strong>Phone Camera Scan</strong>: Scan the QR code above with any mobile camera (connected to Wi-Fi) to experience it like a real guest.
          </li>
          <li>
            <strong>Real-time WebSockets</strong>: Placing an order instantly plays an audible bell chime in the staff dashboard with zero delay!
          </li>
        </ul>
      </div>
    </div>
  );
}
