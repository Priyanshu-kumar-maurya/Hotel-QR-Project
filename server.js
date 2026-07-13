const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');

app.use(cors());
app.use(express.json());

// Helper function to get local IP address for QR scanning on mobile
function getLocalIp() {
  const networkInterfaces = os.networkInterfaces();
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      // Look for IPv4 that is not internal
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Read orders from local JSON file
function readOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading orders file:', error);
    return [];
  }
}

// Write orders to local JSON file
function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error writing orders file:', error);
  }
}

// API Routes
app.get('/api/ip', (req, res) => {
  res.json({ ip: getLocalIp(), port: PORT });
});

// Get all orders (for Chef Dashboard)
app.get('/api/orders', (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// Place new order (from Customer Menu)
app.post('/api/orders', (req, res) => {
  const { tableNumber, items, customerName, customerPhone, totalAmount, specialInstructions } = req.body;
  
  if (!tableNumber || !items || !items.length) {
    return res.status(400).json({ error: 'Table number and items are required.' });
  }

  const orders = readOrders();
  const newOrder = {
    id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    tableNumber,
    items,
    customerName: customerName || 'Anonymous',
    customerPhone: customerPhone || '',
    totalAmount,
    specialInstructions: specialInstructions || '',
    status: 'pending', // pending, preparing, ready, completed
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.push(newOrder);
  writeOrders(orders);
  
  res.status(211).json(newOrder);
});

// Update order status (from Chef Dashboard or Client Status poll)
app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'preparing', 'ready', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const orders = readOrders();
  const orderIndex = orders.findIndex(o => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  orders[orderIndex].status = status;
  orders[orderIndex].updatedAt = new Date().toISOString();
  
  writeOrders(orders);

  res.json(orders[orderIndex]);
});

// Serve frontend static build files in production
const clientBuildPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  
  // Catch-all route to serve the built index.html for React routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // Simple welcome API message when running in pure backend / dev mode without build
  app.get('/', (req, res) => {
    res.send('QR Hotel Ordering API is running. Build the client (npm run build) to serve it from here!');
  });
}

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`Server is running on: http://localhost:${PORT}`);
  console.log(`Local network URL:   http://${getLocalIp()}:${PORT}`);
  console.log(`===================================================`);
});
