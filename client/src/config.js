// Dynamic configuration for backend API and WebSocket endpoints
// When deploying frontend to Vercel, set the environment variable: VITE_API_URL=https://your-backend.onrender.com

export const BACKEND_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '') 
  : window.location.origin;

export const WS_URL = BACKEND_URL.replace(/^http/, 'ws');
