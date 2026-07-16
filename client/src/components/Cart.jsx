import React, { useState } from 'react';
import { BACKEND_URL } from '../config';

export default function Cart({ isOpen, onClose, cart, tableNumber, onUpdateCart, onOrderPlaced }) {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [adminPhone, setAdminPhone] = useState('919999999999'); // Default sample Indian number (91 + 10 digits)
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const generateWhatsAppLink = (orderId) => {
    let itemsText = cart.map(item => `- ${item.qty}x ${item.name} (₹${item.price * item.qty})`).join('\n');
    let text = `🔔 *NEW ORDER - TABLE ${tableNumber}*\n`;
    text += `*Order ID:* ${orderId}\n`;
    text += `--------------------------------\n`;
    text += `👤 *Customer:* ${name || 'Anonymous'}\n`;
    text += `🍛 *Items Ordered:*\n${itemsText}\n`;
    text += `--------------------------------\n`;
    if (instructions.trim()) {
      text += `📝 *Instructions:* ${instructions}\n`;
      text += `--------------------------------\n`;
    }
    text += `💰 *Total Amount:* ₹${totalAmount}\n`;
    text += `--------------------------------\n`;
    text += `📱 Placed via QuickDine QR System`;

    const cleanPhone = adminPhone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleCheckout = async (sendToWhatsApp) => {
    if (cart.length === 0) return;
    setSubmitting(true);

    const orderData = {
      tableNumber,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price
      })),
      customerName: name || 'Guest Customer',
      customerPhone: '',
      totalAmount,
      specialInstructions: instructions
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const newOrder = await response.json();
        
        if (sendToWhatsApp) {
          // Open WhatsApp in new tab
          const whatsappUrl = generateWhatsAppLink(newOrder.id);
          window.open(whatsappUrl, '_blank');
        }

        // Notify parent order was successfully placed
        onOrderPlaced(newOrder);
        onClose();
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Network error. Failed to send order to kitchen.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2 style={{ fontSize: '1.4rem' }}>Your Cart (Table {tableNumber})</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '2.5rem' }}>🛒</span>
              <p style={{ marginTop: '1rem' }}>Your cart is empty.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p>₹{item.price} &times; {item.qty}</p>
                </div>
                <div className="quantity-control">
                  <button onClick={() => onUpdateCart(item, item.qty - 1)} className="qty-btn">-</button>
                  <span className="qty-val">{item.qty}</span>
                  <button onClick={() => onUpdateCart(item, item.qty + 1)} className="qty-btn">+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-checkout-form">
            <div className="cart-summary-row">
              <span>Total Amount:</span>
              <span className="cart-summary-total">₹{totalAmount}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Your Name (Aapka Naam)</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Special Cooking Instructions</label>
              <textarea
                placeholder="e.g. Less spicy, make tea strong"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="form-input"
                style={{ resize: 'none', height: '60px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Admin WhatsApp Number (for Demo)</label>
              <input
                type="text"
                placeholder="Country code + mobile (e.g. 919999999999)"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => handleCheckout(true)}
                disabled={submitting}
                className="btn-primary"
                style={{ background: '#25D366', color: 'white' }} // WhatsApp Green
              >
                💬 {submitting ? 'Placing...' : 'Place Order & Send WhatsApp'}
              </button>
              
              <button
                onClick={() => handleCheckout(false)}
                disabled={submitting}
                className="btn-secondary"
              >
                🍳 {submitting ? 'Placing...' : 'Send Direct to Kitchen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
