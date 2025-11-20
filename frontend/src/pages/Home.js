import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Star, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { getAuthHeader } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/products`, getAuthHeader()),
        axios.get(`${API}/categories`, getAuthHeader())
      ]);
      setProducts(productsRes.data.slice(0, 8)); // Featured products
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (productId) => {
    addToCart(productId, 1);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navbar />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden py-20 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
              data-testid="hero-title"
            >
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Shop Fresh,
              </span>
              <br />
              <span className="text-gray-900">Live Better</span>
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              Discover quality products at unbeatable prices. Fresh groceries, electronics, and more delivered to your door.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="max-w-xl mx-auto relative"
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="home-search-input"
                className="pl-12 h-14 text-base rounded-2xl border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <Link to="/shop">
                <Button
                  data-testid="browse-shop-button"
                  size="lg"
                  className="h-14 px-10 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  Browse Shop
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12 text-gray-900"
            data-testid="categories-section"
          >
            Shop by Category
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Link to={`/shop?category=${category.name}`}>
                  <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100">
                    <div className="aspect-square bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl mb-4 flex items-center justify-center">
                      <span className="text-4xl">&#128722;</span>
                    </div>
                    <h3 className="text-center font-semibold text-gray-900">{category.name}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12 text-gray-900"
            data-testid="featured-products-section"
          >
            Featured Products
          </motion.h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-md">
                  <div className="skeleton h-48 rounded-xl mb-4"></div>
                  <div className="skeleton h-6 mb-2"></div>
                  <div className="skeleton h-4 w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all border border-gray-100"
                  data-testid={`product-card-${product.id}`}
                >
                  <Link to={`/product/${product.id}`}>
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={product.images[0] || 'https://via.placeholder.com/400'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform hover:scale-110 duration-500"
                      />
                      {product.stock < 10 && (
                        <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                          Low Stock
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-emerald-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.ratings)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">({product.reviews_count})</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-emerald-600">₹{product.price.toFixed(0)}</span>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product.id)}
                        data-testid={`add-to-cart-${product.id}`}
                        className="bg-emerald-500 hover:bg-emerald-600 rounded-xl hover:scale-110 transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/shop">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 rounded-xl border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:scale-105 transition-all"
                data-testid="view-all-products-button"
              >
                View All Products
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;