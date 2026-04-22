/**
 * Helper functions for session ID data migration
 * Transfers guest cart and behavior data to newly authenticated users
 */

const db = require('../db');

/**
 * Transfer all guest data from session_id to authenticated user_id
 * Called after successful login or registration
 * 
 * @param {string} sessionId - Guest session ID
 * @param {number} userId - Newly authenticated user ID
 * @returns {Promise<Object>} Migration result with counts
 */
const transferGuestDataToUser = async (sessionId, userId) => {
  if (!sessionId || !userId) {
    return { success: false, error: 'Invalid sessionId or userId' };
  }

  try {
    let cartTransferred = 0;
    let behaviorTransferred = 0;
    let favoritesTransferred = 0;

    // ==== STEP 1: Transfer cart items from session_id to user_id ====
    // Get all cart items for this session
    const [cartItems] = await db.query(
      'SELECT * FROM cart_items WHERE session_id = ? AND user_id IS NULL',
      [sessionId]
    );

    if (cartItems.length > 0) {
      // For each cart item, either update existing or insert new
      for (const item of cartItems) {
        // Check if user already has this product in cart
        const [existing] = await db.query(
          'SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?',
          [userId, item.product_id]
        );

        if (existing.length > 0) {
          // Merge quantities: add guest quantity to existing quantity
          await db.query(
            'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
            [item.quantity, userId, item.product_id]
          );
        } else {
          // Insert new cart item for this user
          await db.query(
            'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
            [userId, item.product_id, item.quantity]
          );
        }
      }
      cartTransferred = cartItems.length;
      console.log(`✅ Transferred ${cartTransferred} cart items from session ${sessionId} to user ${userId}`);
    }

    // ==== STEP 2: Transfer behavior logs from session_id to user_id ====
    // Get all behavior logs for this session
    const [behaviorLogs] = await db.query(
      'SELECT * FROM user_behavior_logs WHERE session_id = ? AND user_id IS NULL',
      [sessionId]
    );

    if (behaviorLogs.length > 0) {
      // Update all behavior logs to user_id and clear session_id
      await db.query(
        'UPDATE user_behavior_logs SET user_id = ?, session_id = NULL WHERE session_id = ? AND user_id IS NULL',
        [userId, sessionId]
      );
      behaviorTransferred = behaviorLogs.length;
      console.log(`✅ Transferred ${behaviorTransferred} behavior logs from session ${sessionId} to user ${userId}`);
    }

    // ==== STEP 3: Transfer favorites from session_id to user_id ====
    const [favoriteInsertResult] = await db.query(
      `INSERT IGNORE INTO favorites (user_id, product_id)
       SELECT ?, product_id
       FROM favorites
       WHERE session_id = ? AND user_id IS NULL`,
      [userId, sessionId]
    );

    favoritesTransferred = favoriteInsertResult?.affectedRows || 0;
    if (favoritesTransferred > 0) {
      console.log(`✅ Transferred ${favoritesTransferred} favorites from session ${sessionId} to user ${userId}`);
    }

    // ==== STEP 4: Clean up remaining guest records (optional) ====
    // Delete any remaining guest cart items for this session
    await db.query('DELETE FROM cart_items WHERE session_id = ? AND user_id IS NULL', [sessionId]);
    
    // Delete any remaining guest behavior logs for this session
    await db.query('DELETE FROM user_behavior_logs WHERE session_id = ? AND user_id IS NULL', [sessionId]);

    // Delete guest favorites for this session after migration
    await db.query('DELETE FROM favorites WHERE session_id = ? AND user_id IS NULL', [sessionId]);

    return {
      success: true,
      cartTransferred,
      behaviorTransferred,
      favoritesTransferred,
      message: `Successfully transferred ${cartTransferred} cart items, ${behaviorTransferred} behavior logs and ${favoritesTransferred} favorites`
    };
  } catch (error) {
    console.error('Error transferring guest data:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  transferGuestDataToUser
};
module.exports.transferGuestDataToUser = transferGuestDataToUser;
