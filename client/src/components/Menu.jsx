import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'All', label: 'All Items', icon: '🍽️' },
  { id: 'Starters', label: 'Starters', icon: '🥟' },
  { id: 'Mains', label: 'Main Course', icon: '🍛' },
  { id: 'Desserts', label: 'Desserts', icon: '🍨' },
  { id: 'Beverages', label: 'Beverages', icon: '🥤' }
];

export default function Menu({ menuItems, cart, onUpdateCart }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [spicyOnly, setSpicyOnly] = useState(false);
  const [bestsellerOnly, setBestsellerOnly] = useState(false);

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = !searchQuery.trim() || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesVeg = !vegOnly || item.isVeg;
    const matchesSpicy = !spicyOnly || item.isSpicy;
    const matchesBestseller = !bestsellerOnly || item.isBestseller;

    return matchesCategory && matchesSearch && matchesVeg && matchesSpicy && matchesBestseller;
  });

  const getCartQty = (itemId) => {
    const found = cart.find(i => i.id === itemId);
    return found ? found.qty : 0;
  };

  const resetFilters = () => {
    setActiveCategory('All');
    setSearchQuery('');
    setVegOnly(false);
    setSpicyOnly(false);
    setBestsellerOnly(false);
  };

  return (
    <div className="menu-section">
      {/* Search and Quick Filter Controls */}
      <div className="menu-controls">
        <div className="search-filter-container">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search delicious dishes, drinks, desserts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="modern-search-input"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="clear-search-btn"
                title="Clear Search"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Dietary and Highlights Quick Filter Chips */}
        <div className="diet-filters">
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`filter-chip ${vegOnly ? 'active-veg' : ''}`}
          >
            <span className="fssai-indicator veg" style={{ width: 14, height: 14 }} />
            <span>Veg Only</span>
          </button>

          <button
            onClick={() => setBestsellerOnly(!bestsellerOnly)}
            className={`filter-chip ${bestsellerOnly ? 'active-bestseller' : ''}`}
          >
            <span>⭐</span>
            <span>Bestsellers</span>
          </button>

          <button
            onClick={() => setSpicyOnly(!spicyOnly)}
            className={`filter-chip ${spicyOnly ? 'active-spicy' : ''}`}
          >
            <span>🌶️</span>
            <span>Spicy</span>
          </button>
        </div>

        {/* Category Chips Horizontal Bar */}
        <div className="category-chips-scroll">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div className="menu-grid">
        {filteredItems.map(item => {
          const qty = getCartQty(item.id);
          const isSoldOut = item.isAvailable === false;

          return (
            <div 
              key={item.id} 
              className={`food-card ${isSoldOut ? 'sold-out' : ''}`}
            >
              {/* Food Image with overlays */}
              <div className="food-card-img-wrap">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="food-card-img" 
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
                  }}
                />

                {/* Top Badges */}
                <div className="food-card-top-badges">
                  <div className="badge-row-left">
                    {/* FSSAI Standard Indicator */}
                    <div className={`fssai-indicator ${item.isVeg ? 'veg' : 'non-veg'}`} title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'} />
                    
                    {item.isBestseller && (
                      <span className="pill-badge bestseller-badge">
                        ⭐ Bestseller
                      </span>
                    )}
                  </div>

                  <span className="pill-badge rating-badge">
                    ★ {item.rating || '4.8'}
                  </span>
                </div>

                {/* Sold Out Overlay */}
                {isSoldOut && (
                  <div className="sold-out-overlay">
                    <span className="sold-out-tag">Sold Out</span>
                  </div>
                )}
              </div>

              {/* Food Content Details */}
              <div className="food-card-body">
                <div className="food-card-header">
                  <h3 className="food-title">{item.name}</h3>
                  <span className="food-price">₹{item.price}</span>
                </div>

                <p className="food-desc" title={item.desc}>
                  {item.desc || 'Prepared fresh with chef curated spices and premium ingredients.'}
                </p>

                <div className="food-card-footer">
                  <span className="prep-time">
                    ⏱️ {item.prepTime || '10-15m'}
                  </span>

                  {/* Add / Qty Controls */}
                  {isSoldOut ? (
                    <button disabled className="add-btn">
                      Unavailable
                    </button>
                  ) : qty > 0 ? (
                    <div className="qty-counter-pill">
                      <button 
                        onClick={() => onUpdateCart(item, qty - 1)} 
                        className="qty-ctrl-btn"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="qty-ctrl-val">{qty}</span>
                      <button 
                        onClick={() => onUpdateCart(item, qty + 1)} 
                        className="qty-ctrl-btn"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onUpdateCart(item, 1)} 
                      className="add-btn"
                    >
                      <span>+</span>
                      <span>ADD</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🍽️</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No matching dishes found
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '340px', margin: '0 auto 1.5rem auto' }}>
            We couldn't find any dishes matching your current filter or search criteria.
          </p>
          <button 
            onClick={resetFilters} 
            className="icon-btn"
            style={{ padding: '0.6rem 1.4rem', borderColor: 'var(--accent)', color: 'var(--accent-light)' }}
          >
            Clear Filters & View All Menu
          </button>
        </div>
      )}
    </div>
  );
}
