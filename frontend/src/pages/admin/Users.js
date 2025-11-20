import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Shield, Search, User } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { getAuthHeader } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, getAuthHeader());
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/role?role=${newRole}`, {}, getAuthHeader());
      toast.success('User role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8" data-testid="users-admin-title">Users Management</h1>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-users-input"
            className="pl-10 h-12"
          />
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-48 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow"
                data-testid={`user-card-${user.id}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900" data-testid={`username-${user.id}`}>{user.username}</h3>
                    <p className="text-sm text-gray-500" data-testid={`email-${user.id}`}>{user.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-5 h-5 ${
                        user.role === 'admin' ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">Role</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`} data-testid={`role-${user.id}`}>
                      {user.role}
                    </span>
                  </div>

                  {user.role !== 'admin' ? (
                    <Button
                      onClick={() => handleRoleChange(user.id, 'admin')}
                      data-testid={`promote-${user.id}`}
                      className="w-full bg-purple-500 hover:bg-purple-600 rounded-lg"
                      size="sm"
                    >
                      Promote to Admin
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleRoleChange(user.id, 'user')}
                      data-testid={`demote-${user.id}`}
                      variant="outline"
                      className="w-full border-2 border-gray-300 hover:bg-gray-50 rounded-lg"
                      size="sm"
                    >
                      Demote to User
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;