import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const { getAuthHeader } = useAuth();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      if (!cart.items || cart.items.length === 0) {
        navigate('/cart');
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
      toast.error('Failed to load cart');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        `${API}/orders`,
        {
          shipping_address: address,
          payment_method: paymentMethod
        },
        getAuthHeader()
      );

      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 }
      });

      toast.success('Order placed successfully!');
      await clearCart();
      navigate('/orders');
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-gray-900 mb-8"
          data-testid="checkout-title"
        >
          Checkout
        </motion.h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Shipping & Payment */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6" data-testid="shipping-section">Shipping Address</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    data-testid="street-input"
                    required
                    className="mt-1 h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      data-testid="city-input"
                      required
                      className="mt-1 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      data-testid="state-input"
                      required
                      className="mt-1 h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={address.zip}
                      onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                      data-testid="zip-input"
                      required
                      className="mt-1 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={address.country}
                      onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      data-testid="country-input"
                      required
                      className="mt-1 h-11"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6" data-testid="payment-section">Payment Method</h2>
              
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-500 transition-colors cursor-pointer">
                  <RadioGroupItem value="stripe" id="stripe" data-testid="payment-stripe" />
                  <Label htmlFor="stripe" className="flex-1 cursor-pointer flex items-center gap-3">
                    <CreditCard className="w-5 h-5" />
                    <span>Credit/Debit Card (Stripe)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-500 transition-colors cursor-pointer mt-3">
                  <RadioGroupItem value="cod" id="cod" data-testid="payment-cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    Cash on Delivery
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === 'stripe' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
                  <p>Note: This is a demo. No real payment will be processed.</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6" data-testid="order-summary-checkout">Order Summary</h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0" data-testid={`summary-item-${item.id}`}>
                    <img
                      src={item.images[0] || 'https://via.placeholder.com/60'}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-emerald-600">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span data-testid="checkout-subtotal">₹{calculateTotal().toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">FREE</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-emerald-600" data-testid="checkout-total">
                      ₹{calculateTotal().toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                data-testid="place-order-button"
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 disabled:scale-100 transition-all text-base font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Place Order'
                )}
              </Button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;