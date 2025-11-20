import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ShoppingCart, Home, Package, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = getCartCount();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = user?.role === 'admin' ? [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/users', icon: User, label: 'Users' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  ] : [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/shop', icon: ShoppingBag, label: 'Shop' },
    { path: '/orders', icon: Package, label: 'Orders' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to={user?.role === 'admin' ? '/admin' : '/'} className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              SuperMarket
            </span>
          </Link>

          <div className="flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">{item.label}</span>
                </Link>
              );
            })}

            {user?.role !== 'admin' && (
              <Link
                to="/cart"
                data-testid="nav-cart"
                className="relative flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    data-testid="cart-badge"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>
            )}

            <Button
              onClick={handleLogout}
              data-testid="logout-button"
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;