/**
 * Session ID Middleware
 * Extracts session_id from request header and attaches to req object
 * Used for tracking guest (non-authenticated) users
 */

const extractSessionId = (req, res, next) => {
  try {
    // Get session_id from X-Session-Id header
    const sessionId = req.headers['x-session-id'] || req.headers['X-Session-Id'];
    
    if (sessionId) {
      // Validate session_id format (UUID v4-like)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(sessionId)) {
        req.sessionId = sessionId;
        // console.log(`✅ Session ID extracted: ${sessionId}`);
      } else {
        console.warn(`⚠️ Invalid session ID format: ${sessionId}`);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error extracting session ID:', error);
    next();
  }
};

module.exports = extractSessionId;
module.exports.extractSessionId = extractSessionId;
