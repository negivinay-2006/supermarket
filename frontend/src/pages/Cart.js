import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getAuthHeader } = useAuth();
  const { cart, updateCartItem, removeFromCart, refreshCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, [cart]);

  const fetchCartItems = async () => {
    try {
      if (!cart.items || cart.items.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      const productPromises = cart.items.map(item =>
        axios.get(`${API}/products/${item.product_id}`, getAuthHeader())
      );
      
      const products = await Promise.all(productPromises);
      const items = products.map((res, index) => ({
        ...res.data,
        quantity: cart.items[index].quantity
      }));
      
      setCartItems(items);
    } catch (error) {
      toast.error('Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateCartItem(productId, newQuantity);
  };

  const handleRemove = async (productId) => {
    await removeFromCart(productId);
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="skeleton h-12 w-48 mb-8"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-32 mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-gray-900 mb-8"
          data-testid="cart-title"
        >
          Shopping Cart
        </motion.h1>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
            data-testid="empty-cart-message"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some products to get started!</p>
            <Link to="/shop">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">
                Start Shopping
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <div className="flex gap-6">
                      <Link to={`/product/${item.id}`} className="flex-shrink-0">
                        <img
                          src={item.images[0] || 'https://via.placeholder.com/150'}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-xl"
                        />
                      </Link>

                      <div className="flex-1">
                        <Link to={`/product/${item.id}`}>
                          <h3 className="font-semibold text-lg text-gray-900 hover:text-emerald-600 transition-colors mb-1">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-gray-600 text-sm mb-3">{item.category}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              data-testid={`decrease-${item.id}`}
                              className="w-8 h-8 p-0 rounded-lg hover:bg-emerald-50 hover:border-emerald-500 transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-semibold text-lg min-w-[2rem] text-center" data-testid={`quantity-${item.id}`}>
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              data-testid={`increase-${item.id}`}
                              className="w-8 h-8 p-0 rounded-lg hover:bg-emerald-50 hover:border-emerald-500 transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-600" data-testid={`item-total-${item.id}`}>
                              ₹{(item.price * item.quantity).toFixed(0)}
                            </p>
                            <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(item.id)}
                        data-testid={`remove-${item.id}`}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6" data-testid="order-summary">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span data-testid="subtotal">{calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-medium">FREE</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-emerald-600" data-testid="total">
                        {calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/checkout')}
                  data-testid="proceed-to-checkout"
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-base font-semibold"
                >
                  Proceed to Checkout
                </Button>

                <Link to="/shop">
                  <Button
                    variant="outline"
                    data-testid="continue-shopping"
                    className="w-full mt-3 h-12 rounded-xl border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  >
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;