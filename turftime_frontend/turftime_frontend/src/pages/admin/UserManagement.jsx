import { useState, useEffect } from 'react';
import { Search, User, Shield, Ban, CheckCircle, Mail, Phone, Calendar, Download, Users as UsersIcon, TrendingDown, MoreVertical, Eye, Edit, Trash2, AlertTriangle, X } from 'lucide-react';
import Tooltip from '../../components/Tooltip';
import Toast from '../../components/Toast';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null, userName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await adminService.getAllUsers();
      if (result.success) {
        // Normalize backend fields to match frontend expectations
        const normalized = (Array.isArray(result.data) ? result.data : [])
          .filter(u => u.email !== (currentUser?.email || currentUser?.sub))
          .map(u => ({
          id: u.id,
          name: u.name || u.username || 'Unknown',
          email: u.email,
          phone: u.phone || 'N/A',
          role: u.role || 'PLAYER',
          status: (u.status || 'ACTIVE').toLowerCase(), // ACTIVE → active, SUSPENDED → suspended
          joinDate: u.joinDate || u.createdAt || new Date().toISOString().split('T')[0],
          lastActive: u.lastActive || u.updatedAt || new Date().toISOString().split('T')[0],
          username: u.username,
          preferences: u.preferences,
        }));
        setUsers(normalized);
        setError('');
      } else {
        setError(result.message || 'Failed to fetch users');
        setUsers([]);
      }
    } catch (err) {
      setError('Error fetching users');
      console.error('Error:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const mockUsers = [
    {
      id: 1,
      name: 'Harini',
      email: 'harini@email.com',
      phone: '+91 9876543210',
      role: 'PLAYER',
      status: 'active',
      joinDate: '2025-12-15',
      bookings: 24,
      spent: '₹12,500',
      lastActive: '2026-01-28',
    },
    {
      id: 2,
      name: 'Vishani',
      email: 'vishani@email.com',
      phone: '+91 9876543211',
      role: 'OWNER',
      status: 'active',
      joinDate: '2025-11-20',
      venues: 3,
      earnings: '₹4.2L',
      lastActive: '2026-01-29',
    },
    {
      id: 3,
      name: 'Babisha',
      email: 'babisha@email.com',
      phone: '+91 9876543212',
      role: 'PLAYER',
      status: 'suspended',
      joinDate: '2026-01-10',
      bookings: 5,
      spent: '₹2,800',
      lastActive: '2026-01-25',
      suspensionReason: 'Multiple booking cancellations',
    },
    {
      id: 4,
      name: 'Sujitha',
      email: 'sujitha@email.com',
      phone: '+91 9876543213',
      role: 'PLAYER',
      status: 'active',
      joinDate: '2025-10-05',
      bookings: 48,
      spent: '₹28,400',
      lastActive: '2026-01-29',
    },
    {
      id: 5,
      name: 'Janani',
      email: 'janani@email.com',
      phone: '+91 9876543214',
      role: 'OWNER',
      status: 'active',
      joinDate: '2025-09-12',
      venues: 2,
      earnings: '₹1.8L',
      lastActive: '2026-01-28',
    },
  ];

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.phone.includes(searchQuery);
    return matchesRole && matchesStatus && matchesSearch;
  });

  const stats = {
    total: users.length,
    players: users.filter(u => u.role === 'PLAYER').length,
    owners: users.filter(u => u.role === 'OWNER').length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
  };

  const handleSuspend = (userId) => {
    const targetUser = users.find(user => user.id === userId);
    setSuspendTarget(targetUser || null);
    setSuspendReason('');
    setShowSuspendModal(true);
  };

  const confirmSuspend = async () => {
    try {
      const result = await adminService.suspendUser(suspendTarget.email);
      if (result.success) {
        // Update user in local state
        setUsers(users.map(u => 
          u.id === suspendTarget.id ? { ...u, status: 'suspended' } : u
        ));
        setShowSuspendModal(false);
        setSuspendTarget(null);
        setSuspendReason('');
        showToast('User suspended successfully');
      } else {
        showToast(result.message || 'Failed to suspend user', 'error');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      showToast('Error suspending user', 'error');
    }
  };

  const cancelSuspend = () => {
    setShowSuspendModal(false);
    setSuspendTarget(null);
    setSuspendReason('');
  };

  const handleViewUser = (user) => {
    setViewUser(user);
    setShowViewModal(true);
  };

  const closeViewUser = () => {
    setShowViewModal(false);
    setViewUser(null);
  };

  const handleActivate = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    try {
      const result = await adminService.reactivateUser(targetUser.email);
      if (result.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, status: 'active' } : u
        ));
      } else {
        showToast(result.message || 'Failed to reactivate user', 'error');
      }
    } catch (error) {
      console.error('Error reactivating user:', error);
      showToast('Failed to reactivate user. Please try again.', 'error');
    }
  };

  const handleDelete = (userId, userName) => {
    setDeleteModal({ isOpen: true, userId, userName });
  };

  const confirmDelete = async () => {
    if (!deleteModal.userId) return;
    
    setIsDeleting(true);
    try {
      const userToDelete = users.find(u => u.id === deleteModal.userId);
      if (!userToDelete) {
        showToast('User not found', 'error');
        return;
      }

      const result = await adminService.deleteUser(userToDelete.email);
      if (result.success) {
        // Remove user from local state
        setUsers(users.filter(u => u.id !== deleteModal.userId));
        setDeleteModal({ isOpen: false, userId: null, userName: '' });
        showToast('User deleted successfully');
      } else {
        showToast(result.message || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, userId: null, userName: '' });
  };

  const handleExportUsers = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Join Date', 'Last Active', 'Bookings/Venues', 'Spent/Earnings'];
    
    const rows = filteredUsers.map(user => [
      user.id,
      user.name,
      user.email,
      user.phone,
      user.role,
      user.status.toUpperCase(),
      user.joinDate,
      user.lastActive,
      user.role === 'PLAYER' ? user.bookings : user.venues,
      user.role === 'PLAYER' ? user.spent : user.earnings,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toast toast={toast} onClose={() => setToast(null)} />
      {/* Suspend Confirmation Modal */}
      {showSuspendModal && suspendTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Ban className="text-red-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Suspend User?</h3>
              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to suspend <span className="font-semibold text-gray-900">{suspendTarget.name}</span>?
              </p>
              <p className="text-xs text-red-600 font-semibold mt-3">THIS ACTION CANNOT BE UNDONE.</p>

              <div className="mt-4 text-left">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason (Optional)</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  placeholder="Add a suspension reason..."
                  className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={cancelSuspend}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-800 rounded-full font-semibold hover:bg-gray-200 transition"
                >
                  No, Keep it
                </button>
                <button
                  onClick={confirmSuspend}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition cursor-pointer"
                >
                  Yes, Suspend
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && viewUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">User Details</h3>
              <button
                onClick={closeViewUser}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <Eye size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 grid gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-linear-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">
                    {viewUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{viewUser.name}</p>
                  <p className="text-sm text-gray-500">{viewUser.role}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="text-sm text-gray-700">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                  <p className="font-medium">{viewUser.email}</p>
                </div>
                <div className="text-sm text-gray-700">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Phone</p>
                  <p className="font-medium">{viewUser.phone}</p>
                </div>
                <div className="text-sm text-gray-700">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Joined</p>
                  <p className="font-medium">{new Date(viewUser.joinDate).toLocaleDateString()}</p>
                </div>
                <div className="text-sm text-gray-700">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Last Active</p>
                  <p className="font-medium">{new Date(viewUser.lastActive).toLocaleDateString()}</p>
                </div>
              </div>
              {viewUser.status === 'suspended' && viewUser.suspensionReason && (
                <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded border border-red-100">
                  {viewUser.suspensionReason}
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={closeViewUser}
                className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-linear-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                  <UsersIcon className="text-white" size={28} />
                </div>
                <h1 className="text-4xl font-bold text-gray-900">
                  User Management
                </h1>
              </div>
              <p className="text-gray-600 text-base ml-14">
                Manage and monitor all platform users and their activities
              </p>
            </div>
            <Tooltip text="Download users list as CSV">
              <button 
                onClick={handleExportUsers}
                className="flex items-center gap-2 bg-linear-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                <Download size={20} />
                Export Data
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-red-600 mt-1 shrink-0" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">Error Loading Users</h3>
                <p className="text-red-700">{error}</p>
                <button 
                  onClick={fetchUsers}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content - Only show when not loading */}
        {!loading && (
          <>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Total Users</p>
                <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">All registered</p>
              </div>
              <div className="p-3 bg-linear-to-br from-gray-100 to-gray-50 rounded-xl">
                <UsersIcon className="text-gray-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-blue-100 transform hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-2">Players</p>
                <p className="text-4xl font-bold text-blue-700">{stats.players}</p>
                <p className="text-xs text-blue-500 mt-1">Active users</p>
              </div>
              <div className="p-3 bg-linear-to-br from-blue-100 to-blue-50 rounded-xl">
                <User className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-purple-100 transform hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-purple-600 uppercase tracking-wide mb-2">Owners</p>
                <p className="text-4xl font-bold text-purple-700">{stats.owners}</p>
                <p className="text-xs text-purple-500 mt-1">Venue providers</p>
              </div>
              <div className="p-3 bg-linear-to-br from-purple-100 to-purple-50 rounded-xl">
                <Shield className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-green-100 transform hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-green-600 uppercase tracking-wide mb-2">Active</p>
                <p className="text-4xl font-bold text-green-700">{stats.active}</p>
                <p className="text-xs text-green-500 mt-1">In good standing</p>
              </div>
              <div className="p-3 bg-linear-to-br from-green-100 to-green-50 rounded-xl">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-red-100 transform hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-red-600 uppercase tracking-wide mb-2">Suspended</p>
                <p className="text-4xl font-bold text-red-700">{stats.suspended}</p>
                <p className="text-xs text-red-500 mt-1">Need attention</p>
              </div>
              <div className="p-3 bg-linear-to-br from-red-100 to-red-50 rounded-xl">
                <Ban className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
            
            {/* Role Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-5 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                  roleFilter === 'all'
                    ? 'bg-linear-to-r from-primary-600 to-primary-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Roles
              </button>
              <button
                onClick={() => setRoleFilter('PLAYER')}
                className={`px-5 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                  roleFilter === 'PLAYER'
                    ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Players
              </button>
              <button
                onClick={() => setRoleFilter('OWNER')}
                className={`px-5 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                  roleFilter === 'OWNER'
                    ? 'bg-linear-to-r from-purple-600 to-purple-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Owners
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-5 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-linear-to-r from-gray-700 to-gray-800 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-5 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                  statusFilter === 'active'
                    ? 'bg-linear-to-r from-green-600 to-green-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('suspended')}
                className={`px-5 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                  statusFilter === 'suspended'
                    ? 'bg-linear-to-r from-red-600 to-red-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Suspended
              </button>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredUsers.length}</span> of <span className="font-semibold text-gray-900">{users.length}</span> users
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-linear-to-r from-gray-50 via-gray-100 to-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Contact Information
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Activity & Stats
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Account Status
                  </th>
                  <th className="px-6 py-5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="text-gray-300 mb-3" size={48} />
                        <p className="text-gray-500 text-lg font-medium">No users found</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-linear-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-lg">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="inline-flex items-center">
                                <Calendar size={12} className="mr-1" />
                                Joined {new Date(user.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail size={14} className="mr-2 text-gray-400" />
                            <span className="font-medium">{user.email}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone size={14} className="mr-2 text-gray-400" />
                            <span>{user.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide shadow-sm ${
                          user.role === 'PLAYER' 
                            ? 'bg-linear-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200' 
                            : 'bg-linear-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200'
                        }`}>
                          {user.role === 'PLAYER' ? (
                            <User size={14} className="mr-1.5" />
                          ) : (
                            <Shield size={14} className="mr-1.5" />
                          )}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {user.role === 'PLAYER' ? (
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-gray-900">
                              {user.bookings} Bookings
                            </div>
                            <div className="text-xs text-gray-600">
                              Total Spent: <span className="font-semibold text-green-700">{user.spent}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Last active: {new Date(user.lastActive).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-gray-900">
                              {user.venues} Venues
                            </div>
                            <div className="text-xs text-gray-600">
                              Total Earnings: <span className="font-semibold text-green-700">{user.earnings}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Last active: {new Date(user.lastActive).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {user.status === 'active' ? (
                              <>
                                <CheckCircle size={14} className="mr-1.5" />
                                Active
                              </>
                            ) : (
                              <>
                                <Ban size={14} className="mr-1.5" />
                                Suspended
                              </>
                            )}
                          </span>
                          {user.status === 'suspended' && user.suspensionReason && (
                            <div className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100">
                              {user.suspensionReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          {user.status === 'active' ? (
                            <Tooltip text="Suspend this user">
                              <button
                                onClick={() => handleSuspend(user.id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-150 font-semibold border border-transparent hover:border-red-200"
                              >
                                <Ban size={18} />
                              </button>
                            </Tooltip>
                          ) : (
                            <Tooltip text="Reactivate this user">
                              <button
                                onClick={() => handleActivate(user.id)}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-150 font-semibold border border-transparent hover:border-green-200"
                              >
                                <CheckCircle size={18} />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip text="View user details">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-150 font-semibold border border-transparent hover:border-blue-200"
                            >
                              <Eye size={18} />
                            </button>
                          </Tooltip>
                          <Tooltip text="Delete user permanently">
                            <button
                              onClick={() => handleDelete(user.id, user.name)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-150 font-semibold border border-transparent hover:border-red-200"
                            >
                              <Trash2 size={18} />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
              </div>
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 text-base mb-2">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteModal.userName}</span>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. All user data, bookings, and related information will be permanently deleted from the system.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin">
                      <Trash2 size={18} />
                    </div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;


