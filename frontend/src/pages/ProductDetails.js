import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Star, ShoppingCart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const { getAuthHeader } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const [productRes, reviewsRes] = await Promise.all([
        axios.get(`${API}/products/${id}`, getAuthHeader()),
        axios.get(`${API}/reviews/${id}`, getAuthHeader())
      ]);
      setProduct(productRes.data);
      setReviews(reviewsRes.data);
    } catch (error) {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(id, 1);
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 }
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/reviews`,
        { product_id: id, rating, comment },
        getAuthHeader()
      );
      toast.success('Review submitted!');
      setComment('');
      setRating(5);
      fetchProductDetails();
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="skeleton h-96 rounded-2xl"></div>
            <div>
              <div className="skeleton h-10 w-3/4 mb-4"></div>
              <div className="skeleton h-6 w-1/2 mb-4"></div>
              <div className="skeleton h-20 mb-4"></div>
              <div className="skeleton h-12 w-40"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link to="/shop">
          <Button variant="ghost" className="mb-6" data-testid="back-to-shop">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
        </Link>

        {/* Product Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-12 mb-16"
        >
          {/* Image */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative aspect-square rounded-3xl overflow-hidden bg-white shadow-xl"
            data-testid="product-image"
          >
            <img
              src={product.images[0] || 'https://via.placeholder.com/600'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Info */}
          <div>
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <span className="inline-block bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm font-medium mb-4">
                {product.category}
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="product-title">{product.name}</h1>
              
              <div className="flex items-center mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < Math.floor(product.ratings)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 ml-3">({product.reviews_count} reviews)</span>
              </div>

              <p className="text-gray-700 mb-8 text-base leading-relaxed" data-testid="product-description">
                {product.description}
              </p>

              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-5xl font-bold text-emerald-600" data-testid="product-price">
                  ₹{product.price.toFixed(0)}
                </span>
                {product.stock < 10 && (
                  <span className="text-red-600 font-medium" data-testid="stock-warning">
                    Only {product.stock} left in stock!
                  </span>
                )}
                {product.stock >= 10 && (
                  <span className="text-green-600 font-medium">
                    In Stock
                  </span>
                )}
              </div>

              <Button
                onClick={handleAddToCart}
                data-testid="add-to-cart-detail"
                size="lg"
                className="w-full md:w-auto h-14 px-12 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3"
              >
                <ShoppingCart className="w-6 h-6" />
                Add to Cart
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-8 shadow-lg"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8" data-testid="reviews-section">Customer Reviews</h2>

          {/* Review Form */}
          <form onSubmit={handleSubmitReview} className="mb-12 p-6 bg-emerald-50 rounded-2xl" data-testid="review-form">
            <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    data-testid={`star-${star}`}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                data-testid="review-comment-input"
                required
                rows={4}
                className="resize-none"
              />
            </div>

            <Button type="submit" data-testid="submit-review-button" className="bg-emerald-500 hover:bg-emerald-600">
              Submit Review
            </Button>
          </form>

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-gray-200 pb-6 last:border-0"
                  data-testid={`review-${review.id}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                      {review.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{review.username}</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetails;