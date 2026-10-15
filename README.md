# 🍽️ QuickDine Pro | Smart Hotel & Restaurant QR Table Ordering System

[![Live Demo](https://img.shields.io/badge/Demo-Vercel%20Live-black?style=for-the-badge&logo=vercel)](https://hotel-qr-project.vercel.app)
[![Backend Status](https://img.shields.io/badge/API-Render%20Live-46E3B7?style=for-the-badge&logo=render)](https://hotel-qr-project.onrender.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Realtime-orange?style=for-the-badge&logo=socketdotio)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

> **QuickDine Pro** is a modern, full-stack, contactless QR table-ordering and Kitchen Display System (KDS) designed for restaurants, cafes, food courts, and hotels. 
> 
> Guests simply scan the QR code on their dining table using their smartphone camera, browse an interactive gourmet menu, customize their order, and send it straight to the kitchen POS in real-time or via WhatsApp — **no app download or registration required**.

---

## 🌐 Live Deployments

- **Customer / Table Ordering App (Vercel)**: [https://hotel-qr-project.vercel.app](https://hotel-qr-project.vercel.app)
  - Table 5 Demo: [https://hotel-qr-project.vercel.app/?table=5](https://hotel-qr-project.vercel.app/?table=5)
  - Kitchen Staff POS: [https://hotel-qr-project.vercel.app/chef](https://hotel-qr-project.vercel.app/chef)
- **Backend API & WebSockets (Render)**: [https://hotel-qr-project.onrender.com](https://hotel-qr-project.onrender.com)
- **GitHub Repository**: [https://github.com/Priyanshu-kumar-maurya/Hotel-QR-Project.git](https://github.com/Priyanshu-kumar-maurya/Hotel-QR-Project.git)

---

## ✨ Key Features

### 📱 1. Modern Customer Experience (Mobile-First)
- **Luxury Dark Glassmorphism UI**: Inspired by high-end dining apps with obsidian dark aesthetic, warm amber/gold accents, and fluid transitions.
- **FSSAI Standard Diet Indicators**: Distinct green square-dot (Veg 🟢) and red square-dot (Non-Veg 🔴) badges on every card.
- **Floating Sticky Cart Bar (Swiggy / Zomato style)**: Adding dishes slides up an animated bottom bar (`🛒 2 Items | ₹420 ── View Order →`), making mobile checkout effortless.
- **Interactive Qty Morphing**: "+ ADD" button smoothly animates into a `- 1 +` pill counter with haptic micro-interactions.
- **Dietary & Category Filters**: Quick-tap chips for **Veg Only**, **Bestsellers ⭐**, and **Spicy 🌶️**, plus category tabs (*Starters, Mains, Desserts, Beverages*).
- **Special Cooking Notes**: Quick suggestion chips (*"Less spicy 🌶️"*, *"No onion/garlic 🧅"*, *"Serve piping hot 🔥"*).
- **Transparent Bill Breakdown**: Shows item subtotal, 5% restaurant GST, and grand total.
- **Dual Order Execution**:
  - **Direct to Kitchen**: Instant kitchen notification via real-time WebSockets.
  - **WhatsApp Receipt**: Generates a pre-filled, cleanly formatted WhatsApp order summary for the restaurant manager.
- **Domino's / Swiggy Style Live Order Tracker**:
  - 4-Stage visual timeline: `Confirmed 📋` ➔ `Cooking 🍳` ➔ `Food Ready 🔔` ➔ `Served ✨`.
  - Audio chime automatically plays on customer's phone when kitchen marks food as ready.
  - Digital itemized receipt with order reference ID.
- **Service Assistance Call**: One-tap button on table view to request **"💧 Water"** or **"🛎️ Call Waiter"** directly to the kitchen POS.
- **Persistent State**: Cart and active order persist in `localStorage` — customer never loses their order state if they lock their phone or refresh the browser.

---

### 👨‍🍳 2. Kitchen Display System (KDS) & Staff POS
- **Multi-Column Kanban Workflow**:
  - `New Orders 🕒` ➔ `Cooking in Kitchen 🍳` ➔ `Ready to Serve 🔔` ➔ `Delivered & Archived 📦`.
- **Order Aging Timer & SLA Warnings**:
  - Normal (< 8 mins)
  - Warning / Orange (8 - 15 mins)
  - Urgent / Red pulse (> 15 mins) to prevent delayed customer orders.
- **Live Stock Management (In Stock / Sold Out)**:
  - Staff can toggle dishes on/off in 1-click. Sold-out dishes immediately reflect on all customer phones in real-time.
- **Menu Editor (CRUD)**:
  - Add, edit, or delete dishes with category, pricing, spice level, veg/non-veg tags, and live image URLs.
- **Real-Time Audio Alerts**:
  - Built-in Web Audio API sound chime triggers instantly when new orders or service calls arrive. Toggleable ON/OFF.
- **Service Call Alerts Banner**:
  - Pops up high-priority alerts when guests request water or waiter assistance with table number and one-click dismiss.
- **Sales Analytics & Reports**:
  - Today's completed order counts, total gross sales volume, average ticket size, and a printable sales ledger.
- **Table QR Standee Generator**:
  - Built-in printable standee card designer for physical tables (e.g. Table 1 to 50) with hotel branding and high-res QR codes.

---

### 🖥️ 3. Interactive Simulator & Split-Screen Testing
- Run customer and kitchen dashboards side-by-side on desktop in a single tab.
- Simulated smartphone mockup frame with notch on the left and Staff POS on the right.
- Instant QR code generator for local Wi-Fi testing.

---

## 🏗️ Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────┐
   │                   CUSTOMER SMARTPHONE                   │
   │           Vercel CDN (React 18 + Vite SPA)              │
   └────────────┬─────────────────────────────▲──────────────┘
                │                             │
    HTTP POST   │                             │  WebSocket Events
   Order / Call │                             │  (Order status updates)
                ▼                             │
   ┌──────────────────────────────────────────┴──────────────┐
   │                     BACKEND SERVER                      │
   │               Render Web Service (Node.js)              │
   │      • Express.js REST API       • WebSocket Server     │
   │      • Heartbeat Keep-Alive      • JSON File Database   │
   └────────────┬─────────────────────────────▲──────────────┘
                │                             │
    WebSocket   │                             │  HTTP PATCH
    Broadcast   │                             │  (Accept & Cook)
   (NEW_ORDER)  │                             │
                ▼                             │
   ┌──────────────────────────────────────────┴──────────────┐
   │                    KITCHEN STAFF POS                    │
   │          Vercel / Render Live Web Dashboard             │
   └─────────────────────────────────────────────────────────┘
```

| Component | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite 5, CSS3 Glassmorphism | Fast SPA with mobile responsive layouts |
| **Backend** | Node.js, Express 4 | REST API with CORS preflight support |
| **Realtime** | `ws` (WebSockets) | Bi-directional events with 25s ping/pong keep-alive |
| **Audio** | Web Audio API | Zero-asset synthetic bell chime alerts |
| **Database** | Lightweight JSON Storage | Zero native C++ compilation; runs everywhere |
| **Hosting** | Vercel (Client) + Render (Server) | Split cloud architecture with automatic routing |

---

## 📁 Project Structure

```
qr-hotel-ordering/
├── client/                     # Frontend React application (Vite)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Cart.jsx         # Slide-up cart drawer, bill breakdown & WhatsApp
│   │   │   ├── ChefDashboard.jsx# KDS Kanban board, stock toggle & menu editor
│   │   │   ├── Menu.jsx         # Responsive gourmet menu with FSSAI tags & filters
│   │   │   ├── OrderStatus.jsx  # Domino's/Swiggy-style 4-step live order tracker
│   │   │   └── Simulator.jsx    # Table QR generator & demo launcher
│   │   ├── App.jsx              # Main routing, WebSocket listener & state
│   │   ├── config.js            # Auto-detection of Vercel / Render backend URLs
│   │   ├── index.css            # Modern luxury dark glassmorphism design system
│   │   └── main.jsx             # React entry point
│   ├── index.html               # Mobile meta tags, viewport-fit & Google Fonts
│   ├── package.json             # Frontend dependencies
│   ├── vercel.json              # Vercel SPA rewrites & cache-control headers
│   └── vite.config.js           # Vite build & WebSocket proxy settings
│
├── menu.json                    # Seeded gourmet menu database (12 items)
├── orders.json                  # Active & completed orders ledger
├── settings.json                # Restaurant settings (name, tax rate, WhatsApp)
├── server.js                    # Express REST API & WebSocket server with heartbeat
├── vercel.json                  # Root deployment fallback configuration
├── package.json                 # Root backend dependencies & scripts
└── README.md                    # Project documentation
```

---

## 🚀 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or newer)
- npm (v9.0 or newer)

### 1. Clone the repository
```bash
git clone https://github.com/Priyanshu-kumar-maurya/Hotel-QR-Project.git
cd Hotel-QR-Project
```

### 2. Install dependencies
```bash
# Installs backend dependencies and triggers client postinstall
npm install
```

### 3. Run Development Mode
To run both backend Express server and Vite frontend concurrently with hot-reload:
```bash
npm run dev
```
- **Customer Simulator**: `http://localhost:5173`
- **Customer Table 5**: `http://localhost:5173/?table=5`
- **Kitchen POS**: `http://localhost:5173/chef`
- **Backend API**: `http://localhost:5000`

---

## 📦 Production Deployment

### Option A: Frontend on Vercel & Backend on Render (Current Setup)

#### 1. Backend on [Render](https://render.com)
1. Create a **New Web Service** and connect this repository.
2. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
3. Deploy! Render will assign a URL like `https://hotel-qr-project.onrender.com`.

#### 2. Frontend on [Vercel](https://vercel.com)
1. Click **Add New Project** and import the repository.
2. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. *(Optional)* Add Environment Variable:
   - `VITE_API_URL` = `https://hotel-qr-project.onrender.com`
   *(Note: `config.js` automatically routes `*.vercel.app` to Render even if omitted).*
4. Deploy! Your app is live with zero-configuration routing.

---

### Option B: Unified Single-Service Deployment on Render
You can also run both frontend and backend on a single Render instance:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
The Express server automatically serves the compiled `client/dist` directory.

---

## 🛠️ API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/ip` | `GET` | Returns server IP address and port for local Wi-Fi QR testing |
| `/api/menu` | `GET` | Returns list of all active dishes with stock availability |
| `/api/menu` | `POST` | Add a new dish to the menu |
| `/api/menu/:id` | `PUT` | Update details of an existing dish |
| `/api/menu/:id/toggle-stock` | `PATCH` | Toggle dish stock (*In Stock* ⟷ *Sold Out*) |
| `/api/menu/:id` | `DELETE` | Remove a dish from the menu |
| `/api/orders` | `GET` | Fetch all active and past orders |
| `/api/orders/:id` | `GET` | Fetch live details of a single order |
| `/api/orders` | `POST` | Create a new order (broadcasts `NEW_ORDER` via WS) |
| `/api/orders/:id` | `PATCH` | Update order status (`pending` ➔ `preparing` ➔ `ready` ➔ `completed`) |
| `/api/service-call` | `POST` | Send waiter/water alert (broadcasts `SERVICE_CALL` via WS) |
| `/api/settings` | `GET/POST` | Get or update restaurant profile and tax settings |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to open an issue or submit a pull request on the [GitHub Repository](https://github.com/Priyanshu-kumar-maurya/Hotel-QR-Project.git).

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
