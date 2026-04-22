import { StrictMode } from 'react'
import axios from 'axios'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeSessionId, getSessionId } from './utils/sessionId'

// Initialize guest session ID on app load
initializeSessionId();

// Bypass NGROK browser warning
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'any-value';

// Axios Interceptor: Automatically add X-Session-Id header to all requests
axios.interceptors.request.use(
  (config) => {
    const sessionId = getSessionId();
    if (sessionId) {
      config.headers['X-Session-Id'] = sessionId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
