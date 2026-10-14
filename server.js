const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 5000;
const MENU_FILE = path.join(__dirname, 'menu.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// Create HTTP and WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Helper to read JSON database files safely
function readJsonFile(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || JSON.stringify(defaultValue));
  } catch (err) {
    console.error(`Error reading database file ${filePath}:`, err);
    return defaultValue;
  }
}

// Helper to write JSON database files safely
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing database file ${filePath}:`, err);
  }
}

// Default Restaurant Settings
const defaultSettings = {
  restaurantName: 'Gourmet Bistro & Cafe',
  tagline: 'Fresh Flavors, Served Fast',
  whatsappNumber: '919876543210',
  currency: '₹',
  taxRate: 5, // 5% GST
  serviceChargeRate: 0,
  enableAudio: true,
  estimatedPrepTimeMins: 15
};

// Seed initial menu data if empty
function initDb() {
  const existingMenu = readJsonFile(MENU_FILE);
  if (existingMenu.length === 0) {
    console.log('Seeding initial gourmet menu items to JSON database...');
    const seedItems = [
      { 
        id: 'm1', 
        name: 'Paneer Tikka', 
        category: 'Starters', 
        price: 240, 
        isVeg: true, 
        isSpicy: true, 
        isBestseller: true,
        rating: 4.8,
        prepTime: '12-15m',
        isAvailable: true,
        desc: 'Clay oven roasted cottage cheese cubes marinated in aromatic tandoori masala and hung curd.', 
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80' 
      },
      { 
        id: 'm2', 
        name: 'Crispy Chicken 65', 
        category: 'Starters', 
        price: 280, 
        isVeg: false, 
        isSpicy: true, 
        isBestseller: true,
        rating: 4.9,
        prepTime: '10-12m',
        isAvailable: true,
        desc: 'South Indian style spiced batter-fried chicken bites tossed with fresh curry leaves and garlic.', 
        image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&q=80' 
      },
      { 
        id: 'm3', 
        name: 'Golden Crispy Corn', 
        category: 'Starters', 
        price: 180, 
        isVeg: true, 
        isSpicy: false, 
        isBestseller: false,
        rating: 4.6,
        prepTime: '8-10m',
        isAvailable: true,
        desc: 'Tender sweet corn tossed in crunch batter with fresh chopped bell peppers and chat masala.', 
        image: 'https://images.unsplash.com/photo-1534080391025-a77af6ebc160?w=500&q=80' 
      },
      { 
        id: 'm4', 
        name: 'Classic Butter Chicken', 
        category: 'Mains', 
        price: 340, 
        isVeg: false, 
        isSpicy: false, 
        isBestseller: true,
        rating: 4.9,
        prepTime: '15-18m',
        isAvailable: true,
        desc: 'Smoked tandoori chicken simmered in rich creamy butter satin tomato gravy.', 
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&q=80' 
      },
      { 
        id: 'm5', 
        name: 'Dal Makhani Bukhara', 
        category: 'Mains', 
        price: 260, 
        isVeg: true, 
        isSpicy: false, 
        isBestseller: true,
        rating: 4.8,
        prepTime: '10-12m',
        isAvailable: true,
        desc: 'Whole black lentils slow cooked for 16 hours with clarified butter and fresh cream.', 
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80' 
      },
      { 
        id: 'm6', 
        name: 'Paneer Butter Masala', 
        category: 'Mains', 
        price: 290, 
        isVeg: true, 
        isSpicy: false, 
        isBestseller: false,
        rating: 4.7,
        prepTime: '12-15m',
        isAvailable: true,
        desc: 'Soft cottage cheese simmered in a mildly spiced, sweet and creamy rich tomato-cashew gravy.', 
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80' 
      },
      { 
        id: 'm7', 
        name: 'Dum Hyderabadi Biryani', 
        category: 'Mains', 
        price: 320, 
        isVeg: false, 
        isSpicy: true, 
        isBestseller: true,
        rating: 4.9,
        prepTime: '15-20m',
        isAvailable: true,
        desc: 'Long grain aged basmati rice layered with juicy marinated chicken pieces cooked under seal.', 
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' 
      },
      { 
        id: 'm8', 
        name: 'Shahi Gulab Jamun (2 Pcs)', 
        category: 'Desserts', 
        price: 120, 
        isVeg: true, 
        isSpicy: false, 
        isBestseller: false,
        rating: 4.7,
        prepTime: '5m',
        isAvailable: true,
        desc: 'Warm khoya dumplings dipped in saffron rose syrup, garnished with slivered pistachios.', 
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80' 
      },
      { 
        id: 'm9', 
        name: 'Warm Choco Lava Brownie', 
        category: 'Desserts', 
        price: 190, 
        isVeg: true, 
        isSpicy: false, 
        isBestseller: true,
        rating: 4.9,
        prepTime: '6-8m',
        isAvailable: true,
        desc: 'Belgian dark chocolate fudge brownie served hot with a scoop of Madagascar vanilla gelato.', 
        image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500&q=80' 
      },
      { 
        id: 'm10', 
        name: 'Special Adrak Elaichi Chai', 
        category: 'Beverages', 
        price: 60, 
        isVeg: true, 
        isSpicy: false, 
        isBestseller: false,
        rating: 4.8,
        prepTime: '5m',
        isAvailable: true,
        desc: 'Authentic freshly brewed hot tea with crushed ginger, cardamom pods and full cream milk.', 
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80' 
      },
      { 
        id: 'm11', 
        name: 'Café Frappe Cold Coffee', 
        category: 'Beverages', 
        price: 130, 
        isVeg: true, 
        isSpicy: false, 
        isBestseller: true,
        rating: 4.8,
        prepTime: '5m',
        isAvailable: true,
        desc: 'Thick creamy blended espresso cold coffee topped with cocoa powder and dark chocolate swirl.', 
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80' 
      },
      { 
        id: 'm12', 
        name: 'Sparkling Fresh Lime Soda', 
        category: 'Beverages', 
        price: 90, 
        isVeg: true, 
        isSpicy: false, 
        isBestseller: false,
        rating: 4.6,
        prepTime: '3m',
        isAvailable: true,
        desc: 'Freshly squeezed key lime with chilled club soda and fresh mint leaves. Sweet or Salted.', 
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80' 
      }
    ];
    writeJsonFile(MENU_FILE, seedItems);
    console.log('JSON database initialized and seeded with 12 gourmet items.');
  }

  // Seed settings if empty
  const settings = readJsonFile(SETTINGS_FILE, defaultSettings);
  if (!settings.restaurantName) {
    writeJsonFile(SETTINGS_FILE, defaultSettings);
  }
}

initDb();

app.use(cors());
app.use(express.json());

// Helper function to get local IP address for QR scanning on mobile
function getLocalIp() {
  const networkInterfaces = os.networkInterfaces();
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// WebSocket connection state with heartbeat keep-alive
const wsClients = new Set();

wss.on('connection', (ws) => {
  ws.isAlive = true;
  wsClients.add(ws);
  console.log(`WebSocket client connected. Active connections: ${wsClients.size}`);
  
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch (e) {
      // ignore
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`WebSocket client disconnected. Active connections: ${wsClients.size}`);
  });
});

// Periodic Heartbeat to prevent Render / proxy 55s timeouts
const heartbeatInterval = setInterval(() => {
  wsClients.forEach((ws) => {
    if (ws.isAlive === false) {
      wsClients.delete(ws);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 25000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Broadcast helper to all connected clients
function broadcastMessage(type, data) {
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// Healthcheck & IP route
app.get('/api/ip', (req, res) => {
  res.json({ ip: getLocalIp(), port: PORT });
});

// Settings Endpoints
app.get('/api/settings', (req, res) => {
  const settings = readJsonFile(SETTINGS_FILE, defaultSettings);
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const current = readJsonFile(SETTINGS_FILE, defaultSettings);
  const updated = { ...current, ...req.body };
  writeJsonFile(SETTINGS_FILE, updated);
  broadcastMessage('SETTINGS_UPDATED', updated);
  res.json(updated);
});

// GET dynamic Menu List
app.get('/api/menu', (req, res) => {
  const menu = readJsonFile(MENU_FILE);
  res.json(menu);
});

// POST Add new menu item
app.post('/api/menu', (req, res) => {
  const { name, category, price, isVeg, isSpicy, isBestseller, desc, image, prepTime } = req.body;
  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Name, Category, and Price are required.' });
  }

  const menu = readJsonFile(MENU_FILE);
  const newItem = {
    id: `m_${Date.now()}`,
    name: name.trim(),
    category: category.trim(),
    price: Number(price),
    isVeg: !!isVeg,
    isSpicy: !!isSpicy,
    isBestseller: !!isBestseller,
    rating: 4.8,
    prepTime: prepTime || '10-15m',
    isAvailable: true,
    desc: desc ? desc.trim() : '',
    image: image ? image.trim() : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'
  };

  menu.push(newItem);
  writeJsonFile(MENU_FILE, menu);
  
  broadcastMessage('MENU_UPDATED', newItem);
  res.status(201).json(newItem);
});

// PUT Edit menu item
app.put('/api/menu/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, price, isVeg, isSpicy, isBestseller, isAvailable, desc, image, prepTime } = req.body;
  
  const menu = readJsonFile(MENU_FILE);
  const itemIndex = menu.findIndex(item => item.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const updatedItem = {
    ...menu[itemIndex],
    name: name !== undefined ? name.trim() : menu[itemIndex].name,
    category: category !== undefined ? category.trim() : menu[itemIndex].category,
    price: price !== undefined ? Number(price) : menu[itemIndex].price,
    isVeg: isVeg !== undefined ? !!isVeg : menu[itemIndex].isVeg,
    isSpicy: isSpicy !== undefined ? !!isSpicy : menu[itemIndex].isSpicy,
    isBestseller: isBestseller !== undefined ? !!isBestseller : (menu[itemIndex].isBestseller || false),
    isAvailable: isAvailable !== undefined ? !!isAvailable : (menu[itemIndex].isAvailable !== false),
    prepTime: prepTime !== undefined ? prepTime : (menu[itemIndex].prepTime || '10-15m'),
    desc: desc !== undefined ? desc.trim() : menu[itemIndex].desc,
    image: image !== undefined ? image.trim() : menu[itemIndex].image
  };

  menu[itemIndex] = updatedItem;
  writeJsonFile(MENU_FILE, menu);
  
  broadcastMessage('MENU_UPDATED', updatedItem);
  res.json(updatedItem);
});

// PATCH Toggle stock availability (In Stock / Sold Out)
app.patch('/api/menu/:id/toggle-stock', (req, res) => {
  const { id } = req.params;
  const menu = readJsonFile(MENU_FILE);
  const itemIndex = menu.findIndex(item => item.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  menu[itemIndex].isAvailable = menu[itemIndex].isAvailable === false ? true : false;
  writeJsonFile(MENU_FILE, menu);
  
  broadcastMessage('MENU_UPDATED', menu[itemIndex]);
  res.json(menu[itemIndex]);
});

// DELETE a menu item
app.delete('/api/menu/:id', (req, res) => {
  const { id } = req.params;
  const menu = readJsonFile(MENU_FILE);
  const filtered = menu.filter(item => item.id !== id);
  
  if (menu.length === filtered.length) {
    return res.status(404).json({ error: 'Item not found' });
  }

  writeJsonFile(MENU_FILE, filtered);
  broadcastMessage('MENU_UPDATED', { deletedId: id });
  res.json({ message: 'Item deleted successfully.' });
});

// GET all orders
app.get('/api/orders', (req, res) => {
  const orders = readJsonFile(ORDERS_FILE);
  res.json(orders);
});

// GET single order by ID
app.get('/api/orders/:id', (req, res) => {
  const orders = readJsonFile(ORDERS_FILE);
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// POST Create new order (Broadcasts to Chef)
app.post('/api/orders', (req, res) => {
  const { tableNumber, items, customerName, customerPhone, totalAmount, specialInstructions, subtotal, tax } = req.body;
  if (!tableNumber || !items || !items.length) {
    return res.status(400).json({ error: 'Table number and items are required.' });
  }

  const orders = readJsonFile(ORDERS_FILE);
  const id = `ord_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`;
  const time = new Date().toISOString();

  const newOrder = {
    id,
    tableNumber,
    items,
    customerName: customerName || 'Guest Customer',
    customerPhone: customerPhone || '',
    subtotal: subtotal || totalAmount,
    tax: tax || 0,
    totalAmount,
    specialInstructions: specialInstructions || '',
    status: 'pending',
    createdAt: time,
    updatedAt: time
  };

  orders.unshift(newOrder); // Add to the beginning of the list
  writeJsonFile(ORDERS_FILE, orders);

  // Broadcast instant WebSocket update to Chef Dashboard
  broadcastMessage('NEW_ORDER', newOrder);

  res.status(201).json(newOrder);
});

// PATCH Update order status (Broadcasts to Customer)
app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status, cancellationReason } = req.body;

  const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const orders = readJsonFile(ORDERS_FILE);
  const orderIndex = orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const time = new Date().toISOString();
  orders[orderIndex].status = status;
  orders[orderIndex].updatedAt = time;
  if (cancellationReason) {
    orders[orderIndex].cancellationReason = cancellationReason;
  }

  writeJsonFile(ORDERS_FILE, orders);

  // Broadcast order status change to Customer view (live WebSocket tracking!)
  broadcastMessage('ORDER_STATUS_UPDATE', orders[orderIndex]);

  res.json(orders[orderIndex]);
});

// POST Call Waiter / Service Assistance
app.post('/api/service-call', (req, res) => {
  const { tableNumber, type, note } = req.body;
  if (!tableNumber) return res.status(400).json({ error: 'Table number required' });

  const serviceAlert = {
    id: `srv_${Date.now()}`,
    tableNumber,
    type: type || 'waiter', // 'waiter', 'water', 'bill', 'cleaning'
    note: note || '',
    time: new Date().toISOString()
  };

  broadcastMessage('SERVICE_CALL', serviceAlert);
  res.json({ success: true, alert: serviceAlert });
});

// Serve frontend static build files in production
const clientBuildPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('QuickDine Modern QR Ordering API & WebSocket Server is Running.');
  });
}

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`QuickDine Modern API:   http://localhost:${PORT}`);
  console.log(`Local network URL:      http://${getLocalIp()}:${PORT}`);
  console.log(`===================================================`);
});
