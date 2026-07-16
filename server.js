const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'restaurant.db');

// Create Server
const server = http.createServer(app);

// Create WebSocket Server
const wss = new WebSocket.Server({ server });

// Connect to SQLite Database
const db = new sqlite3.Database(DB_FILE);

// Promisified DB wrappers for clean async/await
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Seed initial menu data if empty
async function initDb() {
  try {
    // Create Menu Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS menu (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        isVeg INTEGER DEFAULT 1,
        isSpicy INTEGER DEFAULT 0,
        desc TEXT,
        image TEXT
      )
    `);

    // Create Orders Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        tableNumber TEXT NOT NULL,
        items TEXT NOT NULL, -- Stored as stringified JSON array
        customerName TEXT DEFAULT 'Anonymous',
        customerPhone TEXT DEFAULT '',
        totalAmount REAL NOT NULL,
        specialInstructions TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Check if menu is empty, if so, seed standard dishes
    const existingMenu = await dbAll('SELECT id FROM menu LIMIT 1');
    if (existingMenu.length === 0) {
      console.log('Seeding initial gourmet menu items to SQLite database...');
      const seedItems = [
        ['m1', 'Paneer Tikka', 'Starters', 240, 1, 1, 'Clay oven cooked cottage cheese cubes marinated in aromatic spices and yogurt.', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80'],
        ['m2', 'Chicken 65', 'Starters', 280, 0, 1, 'Deep fried spicy chicken chunks tempered with curry leaves and red chilies.', 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&q=80'],
        ['m3', 'Crispy Corn', 'Starters', 180, 1, 0, 'Golden corn kernels fried crisp, tossed with fresh onions, capsicum and herbs.', 'https://images.unsplash.com/photo-1534080391025-a77af6ebc160?w=400&q=80'],
        ['m4', 'Butter Chicken', 'Mains', 340, 0, 0, 'Tender chicken pieces simmered in a creamy, velvety tomato butter gravy.', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80'],
        ['m5', 'Dal Makhani', 'Mains', 260, 1, 0, 'Black lentils slow cooked overnight with butter and cream for a rich finish.', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80'],
        ['m6', 'Paneer Butter Masala', 'Mains', 290, 1, 0, 'Cottage cheese cubes cooked in rich, sweet, and slightly spicy tomato gravy.', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80'],
        ['m7', 'Chicken Biryani', 'Mains', 310, 0, 1, 'Fragrant basmati rice layered with spiced marinated chicken, cooked in dum style.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80'],
        ['m8', 'Gulab Jamun', 'Desserts', 120, 1, 0, 'Soft, melt-in-the-mouth fried dumplings soaked in rose flavored warm sugar syrup.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80'],
        ['m9', 'Chocolate Brownie', 'Desserts', 180, 1, 0, 'Rich, fudgy chocolate brownie served warm with a scoop of vanilla ice cream.', 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=80'],
        ['m10', 'Masala Chai', 'Beverages', 60, 1, 0, 'Authentic Indian spiced tea brewed with fresh ginger, cardamom and milk.', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80'],
        ['m11', 'Cold Coffee', 'Beverages', 120, 1, 0, 'Rich creamy blended cold coffee served with chocolate syrup drizzle.', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80'],
        ['m12', 'Fresh Lime Soda', 'Beverages', 90, 1, 0, 'Refreshing aerated soda with fresh lime juice. Select Salted or Sweet.', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80']
      ];

      for (const item of seedItems) {
        await dbRun(
          'INSERT INTO menu (id, name, category, price, isVeg, isSpicy, desc, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          item
        );
      }
      console.log('Database initialized and seeded.');
    }
  } catch (err) {
    console.error('Error initializing database tables:', err);
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
app.get('/api/menu', async (req, res) => {
  try {
    const items = await dbAll('SELECT * FROM menu');
    // Convert isVeg/isSpicy back to booleans
    const formatted = items.map(item => ({
      ...item,
      isVeg: !!item.isVeg,
      isSpicy: !!item.isSpicy
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Add new menu item
app.post('/api/menu', async (req, res) => {
  const { name, category, price, isVeg, isSpicy, desc, image } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Name, Category, and Price are required.' });
  }

  const id = `m_${Date.now()}`;
  try {
    await dbRun(
      'INSERT INTO menu (id, name, category, price, isVeg, isSpicy, desc, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, category, Number(price), isVeg ? 1 : 0, isSpicy ? 1 : 0, desc || '', image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80']
    );
    const createdItem = await dbGet('SELECT * FROM menu WHERE id = ?', [id]);
    createdItem.isVeg = !!createdItem.isVeg;
    createdItem.isSpicy = !!createdItem.isSpicy;
    
    // Notify clients of menu changes
    broadcastMessage('MENU_UPDATED', null);
    
    res.status(201).json(createdItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Edit menu item
app.put('/api/menu/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, price, isVeg, isSpicy, desc, image } = req.body;
  
  try {
    const item = await dbGet('SELECT * FROM menu WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await dbRun(
      'UPDATE menu SET name = ?, category = ?, price = ?, isVeg = ?, isSpicy = ?, desc = ?, image = ? WHERE id = ?',
      [
        name || item.name,
        category || item.category,
        price !== undefined ? Number(price) : item.price,
        isVeg !== undefined ? (isVeg ? 1 : 0) : item.isVeg,
        isSpicy !== undefined ? (isSpicy ? 1 : 0) : item.isSpicy,
        desc !== undefined ? desc : item.desc,
        image !== undefined ? image : item.image,
        id
      ]
    );

    const updatedItem = await dbGet('SELECT * FROM menu WHERE id = ?', [id]);
    updatedItem.isVeg = !!updatedItem.isVeg;
    updatedItem.isSpicy = !!updatedItem.isSpicy;
    
    // Notify clients of menu changes
    broadcastMessage('MENU_UPDATED', null);

    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a menu item
app.delete('/api/menu/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const item = await dbGet('SELECT * FROM menu WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    await dbRun('DELETE FROM menu WHERE id = ?', [id]);
    
    // Notify clients of menu changes
    broadcastMessage('MENU_UPDATED', null);
    
    res.json({ message: 'Item deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all orders
app.get('/api/orders', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM orders ORDER BY createdAt DESC');
    const formatted = rows.map(r => ({
      ...r,
      items: JSON.parse(r.items) // Parse string back to JSON array
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Create new order (Broadcasts to Chef)
app.post('/api/orders', async (req, res) => {
  const { tableNumber, items, customerName, customerPhone, totalAmount, specialInstructions } = req.body;
  if (!tableNumber || !items || !items.length) {
    return res.status(400).json({ error: 'Table number and items are required.' });
  }

  const id = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const time = new Date().toISOString();

  try {
    await dbRun(
      'INSERT INTO orders (id, tableNumber, items, customerName, customerPhone, totalAmount, specialInstructions, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        tableNumber,
        JSON.stringify(items), // stringify item array
        customerName || 'Guest',
        customerPhone || '',
        totalAmount,
        specialInstructions || '',
        'pending',
        time,
        time
      ]
    );

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

    // Broadcast instant WebSocket update to Chef Dashboard
    broadcastMessage('NEW_ORDER', newOrder);

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH Update order status (Broadcasts to Customer)
app.patch('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'preparing', 'ready', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const order = await dbGet('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const time = new Date().toISOString();
    await dbRun(
      'UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?',
      [status, time, id]
    );

    const updated = {
      ...order,
      items: JSON.parse(order.items),
      status,
      updatedAt: time
    };

    // Broadcast order status change to Customer view (live WebSocket tracking!)
    broadcastMessage('ORDER_STATUS_UPDATE', updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    res.send('QR Hotel Ordering SQLite & WebSocket API is running.');
  });
}

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`SQLite & WebSocket Server: http://localhost:${PORT}`);
  console.log(`Local network URL:          http://${getLocalIp()}:${PORT}`);
  console.log(`===================================================`);
});
