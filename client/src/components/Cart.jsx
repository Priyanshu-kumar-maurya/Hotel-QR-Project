import React, { useState } from 'react';
import { BACKEND_URL } from '../config';

const QUICK_INSTRUCTIONS = [
  'Less spicy 🌶️',
  'Extra crispy ✨',
  'No onion/garlic 🧅',
  'Serve piping hot 🔥',
  'Less oil / healthy 🥗'
];

export default function Cart({ 
  isOpen, 
  onClose, 
  cart, 
  tableNumber, 
  onUpdateCart, 
  onOrderPlaced 
}) {
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('quickdine_cust_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('quickdine_cust_phone') || '');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Subtotal and GST calculation (5% standard restaurant GST)
  const itemTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const gstAmount = Math.round(itemTotal * 0.05);
  const grandTotal = itemTotal + gstAmount;

  const handleAddInstructionChip = (chipText) => {
    if (instructions.includes(chipText)) {
      setInstructions(prev => prev.replace(chipText, '').replace(/,\s*,/, ',').trim());
    } else {
      setInstructions(prev => prev ? `${prev}, ${chipText}` : chipText);
    }
  };

  const generateWhatsAppLink = (orderId, targetPhone = '919876543210') => {
    let itemsText = cart.map(item => `  • ${item.qty}x ${item.name} - ₹${item.price * item.qty}`).join('\n');
    let msg = `🔔 *NEW HOTEL ORDER - TABLE ${tableNumber}*\n`;
    msg += `🆔 *Order Ref:* #${orderId.slice(-6).toUpperCase()}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 *Customer:* ${customerName.trim() || 'Guest'}\n`;
    if (customerPhone.trim()) {
      msg += `📞 *Contact:* ${customerPhone.trim()}\n`;
    }
    msg += `🍽️ *Items Ordered:*\n${itemsText}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💵 *Subtotal:* ₹${itemTotal}\n`;
    msg += `🧾 *GST (5%):* ₹${gstAmount}\n`;
    msg += `💰 *Grand Total:* ₹${grandTotal}\n`;
    if (instructions.trim()) {
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `📝 *Kitchen Note:* ${instructions.trim()}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `⚡ Placed via QuickDine QR System`;

    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleCheckout = async (sendToWhatsApp = false) => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);

    // Save name/phone to localStorage for convenience
    if (customerName.trim()) localStorage.setItem('quickdine_cust_name', customerName.trim());
    if (customerPhone.trim()) localStorage.setItem('quickdine_cust_phone', customerPhone.trim());

    const orderPayload = {
      tableNumber,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price
      })),
      customerName: customerName.trim() || 'Guest Customer',
      customerPhone: customerPhone.trim(),
      subtotal: itemTotal,
      tax: gstAmount,
      totalAmount: grandTotal,
      specialInstructions: instructions.trim()
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        const createdOrder = await response.json();

        if (sendToWhatsApp) {
          const waUrl = generateWhatsAppLink(createdOrder.id);
          window.open(waUrl, '_blank');
        }

        onOrderPlaced(createdOrder);
        onClose();
      } else {
        alert('Could not place order. Please check connection and try again.');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Network issue. Could not reach restaurant server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="cart-header">
          <div className="cart-title-row">
            <h2 className="cart-title">Your Order</h2>
            <span className="nav-table-badge" style={{ fontSize: '0.8rem', padding: '2px 8px' }}>
              📍 Table {tableNumber}
            </span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close cart">
            &times;
          </button>
        </div>

        {/* Scrollable Cart Items */}
        <div className="cart-items-scroll">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>🛒</div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Your tray is empty</h4>
              <p style={{ fontSize: '0.85rem' }}>Select your favorite dishes from the menu to place an order.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item-row">
                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  <p>₹{item.price} &times; {item.qty} = <strong>₹{item.price * item.qty}</strong></p>
                </div>

                <div className="qty-counter-pill">
                  <button 
                    onClick={() => onUpdateCart(item, item.qty - 1)} 
                    className="qty-ctrl-btn"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="qty-ctrl-val">{item.qty}</span>
                  <button 
                    onClick={() => onUpdateCart(item, item.qty + 1)} 
                    className="qty-ctrl-btn"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Cooking Instructions Section */}
          {cart.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                Cooking Notes / Special Requests
              </label>
              <textarea
                placeholder="e.g. Please make it less spicy, extra tissue..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="cart-input-field"
                style={{ resize: 'none', height: '60px', marginBottom: '0.4rem' }}
              />
              <div className="quick-instruction-chips">
                {QUICK_INSTRUCTIONS.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAddInstructionChip(chip)}
                    className={`inst-chip ${instructions.includes(chip) ? 'selected' : ''}`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Details Form */}
          {cart.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="cart-input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Mobile Number (For WhatsApp Updates)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="cart-input-field"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with Bill & Dual Checkout CTA */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="bill-details">
              <div className="bill-row">
                <span>Items Subtotal</span>
                <span>₹{itemTotal}</span>
              </div>
              <div className="bill-row">
                <span>Restaurant GST (5%)</span>
                <span>₹{gstAmount}</span>
              </div>
              <div className="bill-row total-row">
                <span>To Pay</span>
                <span className="bill-total-price">₹{grandTotal}</span>
              </div>
            </div>

            <div className="cart-action-btns">
              <button
                onClick={() => handleCheckout(false)}
                disabled={submitting}
                className="btn-kitchen-order"
              >
                <span>🍳</span>
                <span>{submitting ? 'Sending to Kitchen...' : 'Confirm Order & Send to Kitchen'}</span>
              </button>

              <button
                onClick={() => handleCheckout(true)}
                disabled={submitting}
                className="btn-whatsapp-order"
              >
                <span>💬</span>
                <span>{submitting ? 'Processing...' : 'Order & Share on WhatsApp'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
