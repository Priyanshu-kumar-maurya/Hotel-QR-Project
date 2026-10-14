// Dynamic configuration for backend API and WebSocket endpoints
// If VITE_API_URL is explicitly set, use it.
// If running on Vercel (*.vercel.app), automatically route to the Render backend.
// If running in local Vite development (port 5173), route to local Express server on port 5000.
// Otherwise, default to current origin.

const isViteDev = typeof window !== 'undefined' && window.location.port === '5173';
const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

export const BACKEND_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '') 
  : (isVercel 
      ? 'https://hotel-qr-project.onrender.com' 
      : (isViteDev ? 'http://localhost:5000' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000')));

// Convert http/https to ws/wss for WebSocket connections
export const WS_URL = BACKEND_URL.replace(/^http/, 'ws');

console.log('[QuickDine Config] Resolved BACKEND_URL:', BACKEND_URL);
console.log('[QuickDine Config] Resolved WS_URL:', WS_URL);
