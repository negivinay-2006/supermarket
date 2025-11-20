import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { Users, Package, ShoppingBag, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getAuthHeader } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard`, getAuthHeader());
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2" data-testid="admin-dashboard-title">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your supermarket operations</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white"
            data-testid="stat-users"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-sm opacity-90 mb-1">Total Users</p>
            <p className="text-4xl font-bold">{stats?.total_users || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white"
            data-testid="stat-products"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-sm opacity-90 mb-1">Total Products</p>
            <p className="text-4xl font-bold">{stats?.total_products || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white"
            data-testid="stat-orders"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-sm opacity-90 mb-1">Total Orders</p>
            <p className="text-4xl font-bold">{stats?.total_orders || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white"
            data-testid="stat-revenue"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-sm opacity-90 mb-1">Total Revenue</p>
            <p className="text-4xl font-bold">${stats?.total_revenue?.toFixed(2) || '0.00'}</p>
          </motion.div>
        </div>

        {/* Low Stock Alert */}
        {stats?.low_stock_products > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8"
            data-testid="low-stock-alert"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">Low Stock Alert</h3>
                <p className="text-red-700">
                  {stats.low_stock_products} product{stats.low_stock_products > 1 ? 's' : ''} running low on stock. Check inventory to restock.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Stats</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <p className="text-sm text-blue-700 mb-2">Average Order Value</p>
              <p className="text-3xl font-bold text-blue-900">
                ${stats?.total_orders > 0 ? (stats.total_revenue / stats.total_orders).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <p className="text-sm text-emerald-700 mb-2">Products per Category</p>
              <p className="text-3xl font-bold text-emerald-900">
                {stats?.total_products && (stats.total_products / 5).toFixed(0)}
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <p className="text-sm text-purple-700 mb-2">Orders per User</p>
              <p className="text-3xl font-bold text-purple-900">
                {stats?.total_users > 0 ? (stats.total_orders / stats.total_users).toFixed(1) : '0'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;