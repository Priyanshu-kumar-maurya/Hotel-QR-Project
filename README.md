# QuickDine | QR Hotel Ordering System

A premium, modern QR-code-based menu and table ordering system for hotels/restaurants. It allows customers to scan a QR code at their table, view a beautiful interactive menu, and place orders directly to the kitchen or via WhatsApp.

## Features

- **Table QR Simulator**: Select table numbers, dynamically generate QR codes, and run side-by-side split screen tests of the Customer Menu and Chef Dashboard.
- **Modern Gourmet Menu**: Responsive menu with search, category filtering (Starters, Mains, Desserts, Beverages), Veg/Non-Veg filters, and smooth cart transitions.
- **Real-Time Chef Dashboard**: Multi-column board (New, Cooking, Ready) with live updating order statuses.
- **Audio Chimes**: Synced audio sound alerts (using Web Audio API) notifying the Chef of new orders and the Customer when their food is marked as ready.
- **WhatsApp Integration**: Automatically builds a WhatsApp click-to-chat formatted order string containing order summaries for the hotel manager.
- **Local network QR code**: Dynamically fetches the host PC's local IP address so real mobile phones on the same Wi-Fi can scan and view the menu.

---

## Getting Started

### Prerequisites

Ensure you have **Node.js** (v18+) and **npm** installed.

### Installation

1. Clone or download this project.
2. In the root directory, install all dependencies:
   ```bash
   npm install
   ```

### Running the App

#### Production Mode (Recommended)

1. Build the production assets for the client:
   ```bash
   npm run build
   ```
2. Start the unified Express server:
   ```bash
   npm start
   ```
3. Open your browser and go to: `http://localhost:5000`

#### Development Mode

To run both backend and frontend development servers concurrently with hot-reloading:
```bash
npm run dev
```
- Client runs on: `http://localhost:5173`
- Backend runs on: `http://localhost:5000`
