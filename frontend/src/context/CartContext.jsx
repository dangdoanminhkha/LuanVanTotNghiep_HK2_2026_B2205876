import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState(() => {
    // Initialize from localStorage immediately
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (e) {
        console.error('Error parsing cart from localStorage:', e);
        localStorage.removeItem('cart');
        return [];
      }
    }
    return [];
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Mark as loaded after initial render
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  // Sync with server when user logs in
  useEffect(() => {
    const syncCartWithServer = async () => {
      if (isAuthenticated && cartItems.length > 0) {
        try {
          // Optionally sync localStorage cart to server here
          // For now, we keep using localStorage as the source of truth
        } catch (error) {
          console.error('Error syncing cart:', error);
        }
      }
    };
    syncCartWithServer();
  }, [isAuthenticated, cartItems.length]);

  const addToCart = useCallback((item) => {
    setCartItems(prev => {
      // Check if item already exists (same variant_id, size, color)
      const existingIndex = prev.findIndex(
        i => i.variant_id === item.variant_id && i.size === item.size && i.color === item.color
      );

      if (existingIndex >= 0) {
        // Update quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + (item.quantity || 1)
        };
        return updated;
      }

      // Add new item
      return [...prev, { ...item, quantity: item.quantity || 1, addedAt: Date.now() }];
    });
  }, []);

  const removeFromCart = useCallback((index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index, quantity) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter((_, i) => i !== index));
      return;
    }
    setCartItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity };
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem('cart');
  }, []);

  // Update cart item (change variant/color/size)
  const updateCartItem = useCallback((index, updates) => {
    setCartItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const price = item.salePrice || item.price;
      return total + (price * item.quantity);
    }, 0);
  }, [cartItems]);

  const getCartCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const value = {
    cart: cartItems,
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    updateCartItem,
    getCartTotal,
    getCartCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
