import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Star, ShoppingCart, Filter } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { getAuthHeader } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchData();
  }, [selectedCategory, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/products`, {
          ...getAuthHeader(),
          params: {
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            search: searchQuery || undefined
          }
        }),
        axios.get(`${API}/categories`, getAuthHeader())
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (productId, e) => {
    e.preventDefault();
    addToCart(productId, 1);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="shop-title">Browse Products</h1>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="shop-search-input"
                className="pl-10 h-12"
              />
            </div>
            
            <div className="w-full sm:w-64">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12" data-testid="category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-md">
                <div className="skeleton h-56 rounded-xl mb-4"></div>
                <div className="skeleton h-6 mb-2"></div>
                <div className="skeleton h-4 w-3/4 mb-4"></div>
                <div className="skeleton h-10"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
            data-testid="no-products-message"
          >
            <div className="text-6xl mb-4">&#128269;</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all"
                data-testid={`product-${product.id}`}
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
                        Only {product.stock} left
                      </span>
                    )}
                    <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      {product.category}
                    </span>
                  </div>
                </Link>

                <div className="p-5">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2 hover:text-emerald-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center mb-3">
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
                    <span className="text-sm text-gray-500 ml-2">({product.reviews_count})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-emerald-600">₹{product.price.toFixed(0)}</span>
                    <Button
                      size="sm"
                      onClick={(e) => handleAddToCart(product.id, e)}
                      data-testid={`add-cart-${product.id}`}
                      className="bg-emerald-500 hover:bg-emerald-600 rounded-xl hover:scale-110 transition-all flex items-center gap-2 px-4"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Shop;