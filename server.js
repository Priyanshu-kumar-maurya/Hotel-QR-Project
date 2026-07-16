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

// Create Server
const server = http.createServer(app);

// Create WebSocket Server
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

// Seed initial menu data if empty
function initDb() {
  const existingMenu = readJsonFile(MENU_FILE);
  if (existingMenu.length === 0) {
    console.log('Seeding initial gourmet menu items to JSON database...');
    const seedItems = [
      { id: 'm1', name: 'Paneer Tikka', category: 'Starters', price: 240, isVeg: true, isSpicy: true, desc: 'Clay oven cooked cottage cheese cubes marinated in aromatic spices and yogurt.', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80' },
      { id: 'm2', name: 'Chicken 65', category: 'Starters', price: 280, isVeg: false, isSpicy: true, desc: 'Deep fried spicy chicken chunks tempered with curry leaves and red chilies.', image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&q=80' },
      { id: 'm3', name: 'Crispy Corn', category: 'Starters', price: 180, isVeg: true, isSpicy: false, desc: 'Golden corn kernels fried crisp, tossed with fresh onions, capsicum and herbs.', image: 'https://images.unsplash.com/photo-1534080391025-a77af6ebc160?w=400&q=80' },
      { id: 'm4', name: 'Butter Chicken', category: 'Mains', price: 340, isVeg: false, isSpicy: false, desc: 'Tender chicken pieces simmered in a creamy, velvety tomato butter gravy.', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80' },
      { id: 'm5', name: 'Dal Makhani', category: 'Mains', price: 260, isVeg: true, isSpicy: false, desc: 'Black lentils slow cooked overnight with butter and cream for a rich finish.', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80' },
      { id: 'm6', name: 'Paneer Butter Masala', category: 'Mains', price: 290, isVeg: true, isSpicy: false, desc: 'Cottage cheese cubes cooked in rich, sweet, and slightly spicy tomato gravy.', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80' },
      { id: 'm7', name: 'Chicken Biryani', category: 'Mains', price: 310, isVeg: false, isSpicy: true, desc: 'Fragrant basmati rice layered with spiced marinated chicken, cooked in dum style.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80' },
      { id: 'm8', name: 'Gulab Jamun', category: 'Desserts', price: 120, isVeg: true, isSpicy: false, desc: 'Soft, melt-in-the-mouth fried dumplings soaked in rose flavored warm sugar syrup.', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80' },
      { id: 'm9', name: 'Chocolate Brownie', category: 'Desserts', price: 180, isVeg: true, isSpicy: false, desc: 'Rich, fudgy chocolate brownie served warm with a scoop of vanilla ice cream.', image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=80' },
      { id: 'm10', name: 'Masala Chai', category: 'Beverages', price: 60, isVeg: true, isSpicy: false, desc: 'Authentic Indian spiced tea brewed with fresh ginger, cardamom and milk.', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80' },
      { id: 'm11', name: 'Cold Coffee', category: 'Beverages', price: 120, isVeg: true, isSpicy: false, desc: 'Rich creamy blended cold coffee served with chocolate syrup drizzle.', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80' },
      { id: 'm12', name: 'Fresh Lime Soda', category: 'Beverages', price: 90, isVeg: true, isSpicy: false, desc: 'Refreshing aerated soda with fresh lime juice. Select Salted or Sweet.', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80' }
    ];
    writeJsonFile(MENU_FILE, seedItems);
    console.log('JSON database initialized and seeded.');
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

// WebSocket connection state
const wsClients = new Set();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(`WebSocket client connected. Active connections: ${wsClients.size}`);
  
  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`WebSocket client disconnected. Active connections: ${wsClients.size}`);
  });
});

// Broadcast helper
function broadcastMessage(type, data) {
  const payload = JSON.stringify({ type, data });
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// Server IP
app.get('/api/ip', (req, res) => {
  res.json({ ip: getLocalIp(), port: PORT });
});

// GET dynamic Menu List
app.get('/api/menu', (req, res) => {
  const menu = readJsonFile(MENU_FILE);
  res.json(menu);
});

// POST Add new menu item
app.post('/api/menu', (req, res) => {
  const { name, category, price, isVeg, isSpicy, desc, image } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Name, Category, and Price are required.' });
  }

  const menu = readJsonFile(MENU_FILE);
  const newItem = {
    id: `m_${Date.now()}`,
    name,
    category,
    price: Number(price),
    isVeg: !!isVeg,
    isSpicy: !!isSpicy,
    desc: desc || '',
    image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'
  };

  menu.push(newItem);
  writeJsonFile(MENU_FILE, menu);
  
  // Notify clients of menu changes
  broadcastMessage('MENU_UPDATED', null);
  
  res.status(201).json(newItem);
});

// PUT Edit menu item
app.put('/api/menu/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, price, isVeg, isSpicy, desc, image } = req.body;
  
  const menu = readJsonFile(MENU_FILE);
  const itemIndex = menu.findIndex(item => item.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const updatedItem = {
    ...menu[itemIndex],
    name: name !== undefined ? name : menu[itemIndex].name,
    category: category !== undefined ? category : menu[itemIndex].category,
    price: price !== undefined ? Number(price) : menu[itemIndex].price,
    isVeg: isVeg !== undefined ? !!isVeg : menu[itemIndex].isVeg,
    isSpicy: isSpicy !== undefined ? !!isSpicy : menu[itemIndex].isSpicy,
    desc: desc !== undefined ? desc : menu[itemIndex].desc,
    image: image !== undefined ? image : menu[itemIndex].image
  };

  menu[itemIndex] = updatedItem;
  writeJsonFile(MENU_FILE, menu);
  
  // Notify clients of menu changes
  broadcastMessage('MENU_UPDATED', null);

  res.json(updatedItem);
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
  
  // Notify clients of menu changes
  broadcastMessage('MENU_UPDATED', null);
  
  res.json({ message: 'Item deleted successfully.' });
});

// GET all orders
app.get('/api/orders', (req, res) => {
  const orders = readJsonFile(ORDERS_FILE);
  res.json(orders);
});

// POST Create new order (Broadcasts to Chef)
app.post('/api/orders', (req, res) => {
  const { tableNumber, items, customerName, customerPhone, totalAmount, specialInstructions } = req.body;
  if (!tableNumber || !items || !items.length) {
    return res.status(400).json({ error: 'Table number and items are required.' });
  }

  const orders = readJsonFile(ORDERS_FILE);
  const id = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const time = new Date().toISOString();

  const newOrder = {
    id,
    tableNumber,
    items,
    customerName: customerName || 'Guest',
    customerPhone: customerPhone || '',
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
  const { status } = req.body;

  const validStatuses = ['pending', 'preparing', 'ready', 'completed'];
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

  writeJsonFile(ORDERS_FILE, orders);

  // Broadcast order status change to Customer view (live WebSocket tracking!)
  broadcastMessage('ORDER_STATUS_UPDATE', orders[orderIndex]);

  res.json(orders[orderIndex]);
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
    res.send('QR Hotel Ordering JSON & WebSocket API is running.');
  });
}

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`JSON & WebSocket Server: http://localhost:${PORT}`);
  console.log(`Local network URL:        http://${getLocalIp()}:${PORT}`);
  console.log(`===================================================`);
});
