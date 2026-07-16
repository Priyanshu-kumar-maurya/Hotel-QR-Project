import React, { useState } from 'react';

const CATEGORIES = ['All', 'Starters', 'Mains', 'Desserts', 'Beverages'];

export default function Menu({ menuItems, cart, onUpdateCart }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Filter items based on active category, search query, and veg toggle
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg = !vegOnly || item.isVeg;
    return matchesCategory && matchesSearch && matchesVeg;
  });

  const getCartQty = (itemId) => {
    const item = cart.find(i => i.id === itemId);
    return item ? item.qty : 0;
  };

  return (
    <div>
      {/* Category Horizontal Slider */}
      <div className="category-container">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`category-pill ${activeCategory === category ? 'active' : ''}`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Search & Filter Row */}
      <div className="search-filter-row">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search delicious dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="veg-toggle" onClick={() => setVegOnly(!vegOnly)} style={{ cursor: 'pointer' }}>
          <span 
            style={{ 
              display: 'inline-block', 
              width: '12px', 
              height: '12px', 
              borderRadius: '2px', 
              border: '2px solid #10b981', 
              background: vegOnly ? '#10b981' : 'transparent',
              marginRight: '0.25rem'
            }}
          />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: vegOnly ? '#34d399' : 'var(--text-secondary)' }}>
            Veg Only
          </span>
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div className="menu-grid">
        {filteredItems.map(item => {
          const qty = getCartQty(item.id);
          return (
            <div key={item.id} className="menu-card glass-panel">
              <div className="menu-image-container">
                <img src={item.image} alt={item.name} className="menu-img" />
                <div className="menu-tags">
                  <span className={`tag-badge ${item.isVeg ? 'tag-veg' : 'tag-nonveg'}`}>
                    {item.isVeg ? 'Veg' : 'Non-Veg'}
                  </span>
                  {item.isSpicy ? (
                    <span className="tag-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444' }}>
                      🌶️ Spicy
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="menu-details">
                <div className="menu-title-row">
                  <h3 className="menu-title">{item.name}</h3>
                  <span className="menu-price">₹{item.price}</span>
                </div>
                <p className="menu-desc">{item.desc}</p>
                
                <div className="menu-action">
                  {qty > 0 ? (
                    <div className="quantity-control">
                      <button onClick={() => onUpdateCart(item, qty - 1)} className="qty-btn">-</button>
                      <span className="qty-val">{qty}</span>
                      <button onClick={() => onUpdateCart(item, qty + 1)} className="qty-btn">+</button>
                    </div>
                  ) : (
                    <button onClick={() => onUpdateCart(item, 1)} className="add-cart-btn">
                      + Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '3rem' }}>🍽️</span>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>No dishes found matching your selection.</p>
        </div>
      )}
    </div>
  );
}
