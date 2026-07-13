import React, { useState } from 'react';

// Sample Gourmet Menu Data
export const MENU_ITEMS = [
  {
    id: 'm1',
    name: 'Paneer Tikka',
    category: 'Starters',
    price: 240,
    isVeg: true,
    isSpicy: true,
    desc: 'Clay oven cooked cottage cheese cubes marinated in aromatic spices and yogurt.',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80'
  },
  {
    id: 'm2',
    name: 'Chicken 65',
    category: 'Starters',
    price: 280,
    isVeg: false,
    isSpicy: true,
    desc: 'Deep fried spicy chicken chunks tempered with curry leaves and red chilies.',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&q=80'
  },
  {
    id: 'm3',
    name: 'Crispy Corn',
    category: 'Starters',
    price: 180,
    isVeg: true,
    isSpicy: false,
    desc: 'Golden corn kernels fried crisp, tossed with fresh onions, capsicum and herbs.',
    image: 'https://images.unsplash.com/photo-1534080391025-a77af6ebc160?w=400&q=80'
  },
  {
    id: 'm4',
    name: 'Butter Chicken',
    category: 'Mains',
    price: 340,
    isVeg: false,
    isSpicy: false,
    desc: 'Tender chicken pieces simmered in a creamy, velvety tomato butter gravy.',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80'
  },
  {
    id: 'm5',
    name: 'Dal Makhani',
    category: 'Mains',
    price: 260,
    isVeg: true,
    isSpicy: false,
    desc: 'Black lentils slow cooked overnight with butter and cream for a rich finish.',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80'
  },
  {
    id: 'm6',
    name: 'Paneer Butter Masala',
    category: 'Mains',
    price: 290,
    isVeg: true,
    isSpicy: false,
    desc: 'Cottage cheese cubes cooked in rich, sweet, and slightly spicy tomato gravy.',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80'
  },
  {
    id: 'm7',
    name: 'Chicken Biryani',
    category: 'Mains',
    price: 310,
    isVeg: false,
    isSpicy: true,
    desc: 'Fragrant basmati rice layered with spiced marinated chicken, cooked in dum style.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80'
  },
  {
    id: 'm8',
    name: 'Gulab Jamun',
    category: 'Desserts',
    price: 120,
    isVeg: true,
    isSpicy: false,
    desc: 'Soft, melt-in-the-mouth fried dumplings soaked in rose flavored warm sugar syrup.',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80'
  },
  {
    id: 'm9',
    name: 'Chocolate Brownie',
    category: 'Desserts',
    price: 180,
    isVeg: true,
    isSpicy: false,
    desc: 'Rich, fudgy chocolate brownie served warm with a scoop of vanilla ice cream.',
    image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=80'
  },
  {
    id: 'm10',
    name: 'Masala Chai',
    category: 'Beverages',
    price: 60,
    isVeg: true,
    isSpicy: false,
    desc: 'Authentic Indian spiced tea brewed with fresh ginger, cardamom and milk.',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80'
  },
  {
    id: 'm11',
    name: 'Cold Coffee',
    category: 'Beverages',
    price: 120,
    isVeg: true,
    isSpicy: false,
    desc: 'Rich creamy blended cold coffee served with chocolate syrup drizzle.',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80'
  },
  {
    id: 'm12',
    name: 'Fresh Lime Soda',
    category: 'Beverages',
    price: 90,
    isVeg: true,
    isSpicy: false,
    desc: 'Refreshing aerated soda with fresh lime juice. Select Salted or Sweet.',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80'
  }
];

const CATEGORIES = ['All', 'Starters', 'Mains', 'Desserts', 'Beverages'];

export default function Menu({ cart, onUpdateCart }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Filter items based on active category, search query, and veg toggle
  const filteredItems = MENU_ITEMS.filter(item => {
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
                  {item.isSpicy && (
                    <span className="tag-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444' }}>
                      🌶️ Spicy
                    </span>
                  )}
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
