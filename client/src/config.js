// Dynamic configuration for backend API and WebSocket endpoints
// In local Vite dev (port 5173), route to Express server on port 5000.
// In Vercel deployment, reads VITE_API_URL if configured.
// In unified Render deployment, defaults to window.location.origin.

const isViteDev = typeof window !== 'undefined' && window.location.port === '5173';

export const BACKEND_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '') 
  : (isViteDev ? 'http://localhost:5000' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'));

// Convert http/https to ws/wss for WebSocket
export const WS_URL = BACKEND_URL.replace(/^http/, 'ws');
