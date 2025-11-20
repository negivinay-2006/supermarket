import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const CartContext = createContext();
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const { user, getAuthHeader } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`, getAuthHeader());
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API}/cart/add`,
        { product_id: productId, quantity },
        getAuthHeader()
      );
      setCart(response.data);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      const response = await axios.post(
        `${API}/cart/update`,
        { product_id: productId, quantity },
        getAuthHeader()
      );
      setCart(response.data);
    } catch (error) {
      toast.error('Failed to update cart');
      console.error('Error updating cart:', error);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await axios.delete(
        `${API}/cart/remove/${productId}`,
        getAuthHeader()
      );
      setCart(response.data);
      toast.success('Removed from cart');
    } catch (error) {
      toast.error('Failed to remove from cart');
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API}/cart/clear`, getAuthHeader());
      setCart({ items: [] });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getCartCount = () => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        getCartCount,
        refreshCart: fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};