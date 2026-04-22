/**
 * Session ID utility for guest tracking
 * Generates a unique session_id and manages it in localStorage
 */

const SESSION_ID_KEY = 'guest_session_id';
const SESSION_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Generate a random UUID v4-like session ID
 * @returns {string} A random 36-character session ID
 */
export const generateSessionId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Initialize or retrieve session ID
 * Creates a new one on first visit, retrieves existing one on subsequent visits
 * @returns {string} The session ID
 */
export const initializeSessionId = () => {
  try {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    
    if (!sessionId) {
      // First visit: generate new session ID
      sessionId = generateSessionId();
      localStorage.setItem(SESSION_ID_KEY, sessionId);
      localStorage.setItem(`${SESSION_ID_KEY}_created_at`, Date.now().toString());
      console.log('✅ New guest session created:', sessionId);
    } else {
      // Check if session is still valid (not expired)
      const createdAt = parseInt(localStorage.getItem(`${SESSION_ID_KEY}_created_at`) || '0', 10);
      const isExpired = Date.now() - createdAt > SESSION_TIMEOUT_MS;
      
      if (isExpired) {
        // Session expired, generate new one
        sessionId = generateSessionId();
        localStorage.setItem(SESSION_ID_KEY, sessionId);
        localStorage.setItem(`${SESSION_ID_KEY}_created_at`, Date.now().toString());
        console.log('✅ Session expired, new session created:', sessionId);
      }
    }
    
    return sessionId;
  } catch (error) {
    console.error('Error initializing session ID:', error);
    return generateSessionId();
  }
};

/**
 * Retrieve current session ID
 * @returns {string|null} The session ID or null if not found
 */
export const getSessionId = () => {
  try {
    return localStorage.getItem(SESSION_ID_KEY);
  } catch (error) {
    console.error('Error retrieving session ID:', error);
    return null;
  }
};

/**
 * Clear session ID (called after successful login/registration)
 */
export const clearSessionId = () => {
  try {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(`${SESSION_ID_KEY}_created_at`);
    console.log('✅ Guest session cleared after authentication');
  } catch (error) {
    console.error('Error clearing session ID:', error);
  }
};
