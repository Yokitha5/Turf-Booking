import { useState, useEffect } from 'react';
import { Users, IndianRupee, AlertCircle, CheckCircle, TrendingUp, BarChart3, MessageSquare, Settings, LogOut, Shield, Mail, Phone, MapPin as MapPinIcon, Activity, LineChart, BarChart2, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from './UserManagement';
import DisputeManagement from './DisputeManagement';
import Footer from '../../components/Footer';
import { adminService } from '../../services/adminService';
import venueService from '../../services/venueService';
import { disputeService } from '../../services/disputeService';
import bookingService from '../../services/bookingService';
import authService from '../../services/authService';
import Toast from '../../components/Toast';

const hoursFromSlot = (start = '00:00', end = '00:00') => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(((eh * 60 + em) - (sh * 60 + sm)) / 60, 0);
};

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const { logout, user: authUser } = useAuth();
  const [profileData, setProfileData] = useState({
    name: authUser?.name || 'Admin User',
    email: authUser?.email || 'admin@turftime.com',
    phone: authUser?.phone || '',
    role: 'Super Administrator',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const navigate = useNavigate();

  // Real data state
  const [stats, setStats] = useState([
    { label: 'Total Users',      value: '—', change: '', trend: 'up',   icon: <Users className="text-blue-600" /> },
    { label: 'Total Venues',     value: '—', change: '', trend: 'up',   icon: <MapPinIcon className="text-primary-600" /> },
    { label: 'Platform Revenue', value: '—', change: '', trend: 'up',   icon: <IndianRupee className="text-green-600" /> },
    { label: 'Pending Actions',  value: '—', change: '', trend: 'down', icon: <AlertCircle className="text-orange-600" /> },
  ]);
  const [quickStats, setQuickStats] = useState([
    { label: "Today's Bookings",     value: '—', color: 'blue' },
    { label: 'Active Users',         value: '—', color: 'green' },
    { label: 'Pending Verifications',value: '—', color: 'orange' },
    { label: 'Open Disputes',        value: '—', color: 'red' },
  ]);
  const [profileStats, setProfileStats] = useState({
    actionsToday:      '—',
    usersManaged:      '—',
    disputesResolved:  '—',
    lastLogin:         '',
  });

  // Load real admin profile on mount
  useEffect(() => {
    authService.getMyProfile().then(res => {
      if (res.success && res.data) {
        setProfileData(prev => ({
          ...prev,
          name:  res.data.name  || prev.name,
          email: res.data.email || prev.email,
          phone: res.data.phone || prev.phone,
        }));
      }
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const daysInMonth = today.getDate();
      const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      });

      const toList = (res) => (res?.success && Array.isArray(res.data) ? res.data : []);
      const isActive = (b) => ['confirmed','completed'].includes(b.status?.toLowerCase());

      // Fetch users, active venues (for booking revenue), disputes in parallel
      const [usersRes, venuesRes, disputesRes] = await Promise.all([
        adminService.getAllUsers(),
        venueService.getAllVenues(),
        disputeService.getAllDisputes(),
      ]);

      const users    = toList(usersRes);
      const activeVenues = toList(venuesRes);
      const disputes = toList(disputesRes);

      // Fetch ALL venues (including inactive/pending/demo) by querying each owner's venues
      const ownerUsers = users.filter(u =>
        ['owner','venue_owner','OWNER','VENUE_OWNER'].includes(u.role)
      );
      const ownerVenueResults = await Promise.all(
        ownerUsers.map(u => venueService.getVenuesByOwner(u.email))
      );
      const allOwnerVenues = ownerVenueResults.flatMap(r => toList(r));
      // Deduplicate by id; fall back to activeVenues if no owner venues found
      const venueMap = new Map();
      [...activeVenues, ...allOwnerVenues].forEach(v => venueMap.set(v.id, v));
      const venues = Array.from(venueMap.values());

      const totalUsers    = users.length;
      const activeUsers   = users.filter(u => u.status?.toLowerCase() !== 'suspended').length;
      const totalVenues   = (venues.length || activeVenues.length) + 12; // +12 demo/default venues
      const pendingVenues = venues.filter(v =>
        ['pending','pending_approval','inactive'].includes(v.status?.toLowerCase())
      ).length;
      const openDisputes  = disputes.filter(d =>
        ['open','pending','in_progress'].includes(d.status?.toLowerCase())
      ).length;
      const pendingActions = openDisputes + pendingVenues;

      // Fetch today's bookings + current month revenue across all venues
      const perVenue = await Promise.all(venues.map(async (v) => {
        const [todayRes, monthResults] = await Promise.all([
          bookingService.getBookingsByVenue(v.id, todayStr),
          Promise.all(monthDates.map(d => bookingService.getBookingsByVenue(v.id, d))),
        ]);
        const todayBookings = toList(todayRes).filter(isActive).length;
        const monthRev = monthResults.reduce((s, r) => {
          return s + toList(r).filter(isActive).reduce((rs, b) =>
            rs + (v.pricePerHour || 0) * hoursFromSlot(b.startTime, b.endTime), 0);
        }, 0);
        return { todayBookings, monthRev };
      }));

      const todayBookings = perVenue.reduce((s, v) => s + v.todayBookings, 0);
      const monthRevenue  = Math.round(perVenue.reduce((s, v) => s + v.monthRev, 0));

      const fmtRev = (n) =>
        n >= 10000000 ? `₹${(n/10000000).toFixed(1)}Cr` :
        n >= 100000  ? `₹${(n/100000).toFixed(1)}L`    :
        n >= 1000    ? `₹${(n/1000).toFixed(1)}k`       :
        `₹${n}`;

      setStats([
        { label: 'Total Users',      value: totalUsers,        change: '', trend: 'up',   icon: <Users className="text-blue-600" /> },
        { label: 'Total Venues',     value: totalVenues,       change: '', trend: 'up',   icon: <MapPinIcon className="text-primary-600" /> },
        { label: 'Platform Revenue', value: fmtRev(monthRevenue), change: 'this month', trend: 'up', icon: <IndianRupee className="text-green-600" /> },
        { label: 'Pending Actions',  value: pendingActions,    change: '', trend: pendingActions > 0 ? 'down' : 'up', icon: <AlertCircle className="text-orange-600" /> },
      ]);
      setQuickStats([
        { label: "Today's Bookings",      value: String(todayBookings), color: 'blue' },
        { label: 'Active Users',          value: String(activeUsers),   color: 'green' },
        { label: 'Pending Verifications', value: String(pendingVenues), color: 'orange' },
        { label: 'Open Disputes',         value: String(openDisputes),  color: 'red' },
      ]);

      const resolvedDisputes = disputes.filter(d =>
        ['approved','resolved'].includes(d.status?.toLowerCase())
      ).length;
      const fmtNum = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
      const now = new Date();
      const loginTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setProfileStats({
        actionsToday:     todayBookings,
        usersManaged:     fmtNum(totalUsers),
        disputesResolved: resolvedDisputes,
        lastLogin:        `Today ${loginTime}`,
      });
    };
    load();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const result = await authService.updateProfile(profileData.email, {
        name:  profileData.name,
        phone: profileData.phone,
      });
      if (result.success) {
        setShowEditProfile(false);
        showToast('Profile updated successfully');
      } else {
        showToast(result.message || 'Failed to update profile', 'error');
      }
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const recentActivities = [
    { type: 'venue', message: 'New venue "Sunrise Cricket Academy" submitted for approval', time: '5 min ago', icon: MapPinIcon },
    { type: 'dispute', message: 'Dispute #245 needs urgent attention', time: '15 min ago', icon: AlertCircle },
    { type: 'user', message: '24 new users registered today', time: '1 hour ago', icon: Users },
    { type: 'revenue', message: 'Monthly revenue target achieved', time: '2 hours ago', icon: TrendingUp },
  ];

  const allActivities = [
    { type: 'venue', message: 'New venue "Sunrise Cricket Academy" submitted for approval', time: '5 min ago', icon: MapPinIcon },
    { type: 'dispute', message: 'Dispute #245 needs urgent attention', time: '15 min ago', icon: AlertCircle },
    { type: 'user', message: '24 new users registered today', time: '1 hour ago', icon: Users },
    { type: 'revenue', message: 'Monthly revenue target achieved', time: '2 hours ago', icon: TrendingUp },
    { type: 'venue', message: 'Venue "Elite Football Arena" approved successfully', time: '3 hours ago', icon: MapPinIcon },
    { type: 'user', message: 'New owner registration: Amit Patel', time: '4 hours ago', icon: Users },
    { type: 'dispute', message: 'Dispute #244 resolved - Refund issued', time: '5 hours ago', icon: AlertCircle },
    { type: 'revenue', message: 'Payment received: ₹15,000 from venue bookings', time: '6 hours ago', icon: TrendingUp },
    { type: 'venue', message: 'Venue "City Sports Complex" rejected', time: '7 hours ago', icon: MapPinIcon },
    { type: 'user', message: 'User account suspended: Rahul Sharma', time: '8 hours ago', icon: Users },
    { type: 'dispute', message: 'New dispute filed: Booking cancellation', time: '9 hours ago', icon: AlertCircle },
    { type: 'revenue', message: 'Weekly revenue report generated', time: '10 hours ago', icon: TrendingUp },
  ];

  const revenueData = [
    { month: 'Jul', amount: 85000, label: 'Jul 2025' },
    { month: 'Aug', amount: 92000, label: 'Aug 2025' },
    { month: 'Sep', amount: 88000, label: 'Sep 2025' },
    { month: 'Oct', amount: 105000, label: 'Oct 2025' },
    { month: 'Nov', amount: 98000, label: 'Nov 2025' },
    { month: 'Dec', amount: 115000, label: 'Dec 2025' },
    { month: 'Jan', amount: 124000, label: 'Jan 2026' },
  ];

  const maxRevenue = Math.max(...revenueData.map(d => d.amount));

  const userGrowthData = [
    { month: 'Jul', users: 850, newUsers: 85, label: 'Jul 2025' },
    { month: 'Aug', users: 920, newUsers: 70, label: 'Aug 2025' },
    { month: 'Sep', users: 980, newUsers: 60, label: 'Sep 2025' },
    { month: 'Oct', users: 1050, newUsers: 70, label: 'Oct 2025' },
    { month: 'Nov', users: 1130, newUsers: 80, label: 'Nov 2025' },
    { month: 'Dec', users: 1190, newUsers: 60, label: 'Dec 2025' },
    { month: 'Jan', users: 1248, newUsers: 58, label: 'Jan 2026' },
  ];

  const maxUsers = Math.max(...userGrowthData.map(d => d.users));

  const venuePerformanceData = [
    { venue: 'Elite Football Arena', bookings: 245, rating: 4.8, revenue: 98000, type: 'Football' },
    { venue: 'Green Field Cricket', bookings: 198, rating: 4.6, revenue: 79000, type: 'Cricket' },
    { venue: 'City Sports Complex', bookings: 186, rating: 4.7, revenue: 74000, type: 'Multi-sport' },
    { venue: 'Ace Badminton Courts', bookings: 167, rating: 4.5, revenue: 67000, type: 'Badminton' },
    { venue: 'Pro Tennis Academy', bookings: 142, rating: 4.9, revenue: 57000, type: 'Tennis' },
  ];

  const maxBookings = Math.max(...venuePerformanceData.map(d => d.bookings));

  const regionalData = [
    { region: 'RS Puram', venues: 45, bookings: 1250, users: 356, growth: '+22%' },
    { region: 'Gandhipuram', venues: 38, bookings: 1080, users: 312, growth: '+18%' },
    { region: 'Peelamedu', venues: 52, bookings: 980, users: 287, growth: '+25%' },
    { region: 'Saravanampatti', venues: 48, bookings: 890, users: 198, growth: '+15%' },
    { region: 'Singanallur', venues: 41, bookings: 820, users: 95, growth: '+20%' },
  ];

  const maxRegionalBookings = Math.max(...regionalData.map(d => d.bookings));

  const MenuItem = ({ icon: Icon, label, section, badge }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition relative font-medium ${
        activeSection === section
          ? 'text-white font-bold bg-primary-700/60'
          : 'text-primary-100 hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
      {badge && (
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
          activeSection === section ? 'bg-white text-red-600' : 'bg-red-500 text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-primary-900/90 backdrop-blur border-b border-primary-800/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shrink-0">
                <Shield className="text-white" size={24} />
              </div>
              <h2 className="font-bold text-primary-50 text-xl">TurfTime</h2>
            </div>
            
            <nav className="hidden md:flex items-center gap-1 ml-auto">
              <MenuItem icon={BarChart3} label="Dashboard" section="dashboard" />
              <MenuItem icon={Users} label="User Management" section="users" />
              <MenuItem icon={MessageSquare} label="Disputes" section="disputes" badge="8" />
              <MenuItem icon={TrendingUp} label="Analytics" section="analytics" />
              <MenuItem icon={Settings} label="Admin Profile" section="profile" />
            </nav>

            <div className="flex items-center gap-3 shrink-0 ml-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-primary-50 hover:text-white transition font-medium"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-y-auto">
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-8">
          {activeSection === 'dashboard' && (
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2"><Activity className="text-primary-600" size={32} />Dashboard Overview</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening with TurfTime today.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => {
                  const borderColors = ['border-blue-500', 'border-primary-600', 'border-green-500', 'border-orange-600'];
                  return (
                    <div key={index} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition border-l-4 ${borderColors[index]} p-6`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                          {stat.icon}
                        </div>
                        {stat.change ? (
                          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            stat.trend === 'up'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                      <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                      <div className="mt-4 h-1 bg-linear-to-r from-gray-200 to-gray-100 rounded-full"></div>
                    </div>
                  );
                })}
              </div>
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {quickStats.map((stat, index) => {
                  const colorMap = {
                    blue: { bg: 'from-blue-50 to-blue-100', text: 'text-blue-700', icon: 'text-blue-600' },
                    green: { bg: 'from-green-50 to-green-100', text: 'text-green-700', icon: 'text-green-600' },
                    orange: { bg: 'from-orange-50 to-orange-100', text: 'text-orange-700', icon: 'text-orange-600' },
                    red: { bg: 'from-red-50 to-red-100', text: 'text-red-700', icon: 'text-red-600' }
                  };
                  const colors = colorMap[stat.color];
                  return (
                    <div key={index} className={`bg-linear-to-br ${colors.bg} rounded-xl shadow-sm p-6 text-center border border-gray-200 hover:shadow-md transition`}>
                      <p className={`text-4xl font-bold mb-2 ${colors.text}`}>{stat.value}</p>
                      <p className="text-sm font-semibold text-gray-700">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Activity size={24} className="text-primary-600" />Recent Activity</h2>
                  <button 
                    onClick={() => setShowAllActivities(true)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-semibold transition"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        activity.type === 'venue' ? 'bg-primary-100' :
                        activity.type === 'dispute' ? 'bg-red-100' :
                        activity.type === 'user' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <activity.icon size={18} className={
                          activity.type === 'venue' ? 'text-primary-600' :
                          activity.type === 'dispute' ? 'text-red-600' :
                          activity.type === 'user' ? 'text-blue-600' : 'text-green-600'
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'disputes' && <DisputeManagement />}
          {activeSection === 'analytics' && (
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2"><LineChart className="text-primary-600" size={32} />Platform Analytics</h2>
                <p className="text-gray-600">Track key performance indicators and platform insights</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition">
                  <p className="text-sm text-gray-600 mb-2 font-semibold uppercase">Revenue Growth</p>
                  <p className="text-4xl font-bold text-blue-600 mb-2">+24%</p>
                  <div className="h-1 bg-linear-to-r from-blue-400 to-blue-600 rounded-full"></div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500 hover:shadow-md transition">
                  <p className="text-sm text-gray-600 mb-2 font-semibold uppercase">User Growth</p>
                  <p className="text-4xl font-bold text-green-600 mb-2">+18%</p>
                  <div className="h-1 bg-linear-to-r from-green-400 to-green-600 rounded-full"></div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500 hover:shadow-md transition">
                  <p className="text-sm text-gray-600 mb-2 font-semibold uppercase">Booking Rate</p>
                  <p className="text-4xl font-bold text-purple-600 mb-2">+15%</p>
                  <div className="h-1 bg-linear-to-r from-purple-400 to-purple-600 rounded-full"></div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500 hover:shadow-md transition">
                  <p className="text-sm text-gray-600 mb-2 font-semibold uppercase">Resolution Rate</p>
                  <p className="text-4xl font-bold text-orange-600 mb-2">+32%</p>
                  <div className="h-1 bg-linear-to-r from-orange-400 to-orange-600 rounded-full"></div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-2 mb-2">
                    <LineChart size={20} className="text-blue-600" />
                    <h3 className="font-bold text-gray-900">Revenue Trends</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Track monthly revenue and growth patterns</p>
                  <div className="space-y-4">
                    {revenueData.map((data, index) => {
                      const percentage = (data.amount / maxRevenue) * 100;
                      const isCurrentMonth = data.month === 'Jan';
                      
                      return (
                        <div key={index} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold ${isCurrentMonth ? 'text-blue-700' : 'text-gray-600'}`}>
                              {data.label}
                            </span>
                            <span className={`text-xs font-bold ${isCurrentMonth ? 'text-blue-600' : 'text-gray-900'}`}>
                              ₹{(data.amount / 1000).toFixed(0)}K
                            </span>
                          </div>
                          <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                              className={`h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 ${
                                isCurrentMonth 
                                  ? 'bg-linear-to-r from-blue-500 to-blue-600' 
                                  : 'bg-linear-to-r from-blue-300 to-blue-400 group-hover:from-blue-400 group-hover:to-blue-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 20 && (
                                <span className="text-xs font-semibold text-white">
                                  {data.amount > 100000 ? '↑' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-4 border-t border-blue-100 grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Avg Monthly</p>
                        <p className="text-lg font-bold text-blue-600">
                          ₹{(revenueData.reduce((sum, d) => sum + d.amount, 0) / revenueData.length / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Total Revenue</p>
                        <p className="text-lg font-bold text-green-600">
                          ₹{(revenueData.reduce((sum, d) => sum + d.amount, 0) / 100000).toFixed(1)}L
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-white rounded-xl border border-green-200 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={20} className="text-green-600" />
                    <h3 className="font-bold text-gray-900">User Growth</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Monitor user acquisition and retention</p>
                  <div className="space-y-4">
                    {userGrowthData.map((data, index) => {
                      const percentage = (data.users / maxUsers) * 100;
                      const isCurrentMonth = data.month === 'Jan';
                      const growthRate = index > 0 
                        ? ((data.users - userGrowthData[index - 1].users) / userGrowthData[index - 1].users * 100).toFixed(1)
                        : 0;
                      
                      return (
                        <div key={index} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold ${isCurrentMonth ? 'text-green-700' : 'text-gray-600'}`}>
                                {data.label}
                              </span>
                              {index > 0 && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                  growthRate > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {growthRate > 0 ? '+' : ''}{growthRate}%
                                </span>
                              )}
                            </div>
                            <span className={`text-xs font-bold ${isCurrentMonth ? 'text-green-600' : 'text-gray-900'}`}>
                              {data.users} users
                            </span>
                          </div>
                          <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                              className={`h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 ${
                                isCurrentMonth 
                                  ? 'bg-linear-to-r from-green-500 to-green-600' 
                                  : 'bg-linear-to-r from-green-300 to-green-400 group-hover:from-green-400 group-hover:to-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 20 && (
                                <span className="text-xs font-semibold text-white">
                                  +{data.newUsers}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-4 border-t border-green-100 grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Total Growth</p>
                        <p className="text-lg font-bold text-green-600">
                          +{((userGrowthData[userGrowthData.length - 1].users - userGrowthData[0].users) / userGrowthData[0].users * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Avg New Users</p>
                        <p className="text-lg font-bold text-blue-600">
                          {(userGrowthData.reduce((sum, d) => sum + d.newUsers, 0) / userGrowthData.length).toFixed(0)}/mo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-white rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 size={20} className="text-purple-600" />
                    <h3 className="font-bold text-gray-900">Venue Performance</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Analyze booking rates and popular venues</p>
                  <div className="space-y-4">
                    {venuePerformanceData.map((venue, index) => {
                      const percentage = (venue.bookings / maxBookings) * 100;
                      const colors = [
                        { bar: 'from-purple-500 to-purple-600', bg: 'bg-purple-100', text: 'text-purple-600' },
                        { bar: 'from-purple-400 to-purple-500', bg: 'bg-purple-50', text: 'text-purple-500' },
                        { bar: 'from-purple-300 to-purple-400', bg: 'bg-purple-50', text: 'text-purple-400' },
                        { bar: 'from-purple-200 to-purple-300', bg: 'bg-purple-50', text: 'text-purple-300' },
                        { bar: 'from-purple-200 to-purple-300', bg: 'bg-purple-50', text: 'text-purple-300' },
                      ];
                      
                      return (
                        <div key={index} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-700">
                                {venue.venue}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                                ⭐ {venue.rating}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-gray-900">
                              {venue.bookings} bookings
                            </span>
                          </div>
                          <div className="relative h-7 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                              className={`h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 bg-linear-to-r ${colors[index].bar} group-hover:opacity-90`}
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 25 && (
                                <span className="text-xs font-semibold text-white">
                                  ₹{(venue.revenue / 1000).toFixed(0)}K
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-4 border-t border-purple-100 grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Total Bookings</p>
                        <p className="text-lg font-bold text-purple-600">
                          {venuePerformanceData.reduce((sum, v) => sum + v.bookings, 0)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Avg Rating</p>
                        <p className="text-lg font-bold text-orange-600">
                          {(venuePerformanceData.reduce((sum, v) => sum + v.rating, 0) / venuePerformanceData.length).toFixed(1)} ⭐
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-white rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={20} className="text-orange-600" />
                    <h3 className="font-bold text-gray-900">Regional Insights</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Coimbatore district area-wise distribution</p>
                  <div className="space-y-4">
                    {regionalData.map((region, index) => {
                      const percentage = (region.bookings / maxRegionalBookings) * 100;
                      const colors = [
                        { bar: 'from-orange-500 to-orange-600', badge: 'bg-orange-100 text-orange-700' },
                        { bar: 'from-orange-400 to-orange-500', badge: 'bg-orange-50 text-orange-600' },
                        { bar: 'from-red-400 to-red-500', badge: 'bg-red-50 text-red-600' },
                        { bar: 'from-amber-400 to-amber-500', badge: 'bg-amber-50 text-amber-600' },
                        { bar: 'from-yellow-400 to-yellow-500', badge: 'bg-yellow-50 text-yellow-600' },
                      ];
                      
                      return (
                        <div key={index} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-700">
                                📍 {region.region}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors[index].badge}`}>
                                {region.growth}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-gray-900">
                              {region.bookings} bookings
                            </span>
                          </div>
                          <div className="relative h-7 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                              className={`h-full rounded-lg transition-all duration-500 flex items-center gap-3 px-2 bg-linear-to-r ${colors[index].bar} group-hover:opacity-90`}
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 30 && (
                                <>
                                  <span className="text-xs font-semibold text-white">
                                    {region.venues} venues
                                  </span>
                                  <span className="text-xs font-semibold text-white">
                                    {region.users} users
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-4 border-t border-orange-100 grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Total Areas</p>
                        <p className="text-lg font-bold text-orange-600">
                          {regionalData.length} zones
                        </p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Total Venues</p>
                        <p className="text-lg font-bold text-green-600">
                          {regionalData.reduce((sum, r) => sum + r.venues, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeSection === 'profile' && (
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2"><Settings className="text-primary-600" size={32} />Admin Profile</h2>
                <p className="text-gray-600">Manage your administrator account and settings</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-1 bg-linear-to-br from-primary-50 to-primary-100 rounded-xl shadow-sm p-6 border border-primary-200 hover:shadow-md transition">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border-3 border-primary-300 shadow-sm">
                      <Shield className="text-primary-600" size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{profileData.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{profileData.email}</p>
                    <div className="mt-4 pt-4 border-t border-primary-200 w-full">
                      <p className="text-xs text-gray-600 mb-2 font-semibold">Status</p>
                      <span className="inline-block px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full">✓ ACTIVE</span>
                    </div>
                    <button 
                      onClick={() => setShowEditProfile(true)}
                      className="mt-4 w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition text-sm font-semibold shadow-md"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition">
                  <h3 className="font-bold text-gray-900 mb-6 text-lg flex items-center gap-2"><Mail size={20} className="text-primary-600" />Account Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-gray-200 hover:bg-gray-50 px-3 py-2 rounded transition">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Mail size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 font-semibold uppercase">Email Address</p>
                        <p className="font-semibold text-gray-900 truncate">{profileData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pb-4 border-b border-gray-200 hover:bg-gray-50 px-3 py-2 rounded transition">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                        <Phone size={20} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 font-semibold uppercase">Phone Number</p>
                        <p className="font-semibold text-gray-900">{profileData.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 hover:bg-gray-50 px-3 py-2 rounded transition">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                        <Shield size={20} className="text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 font-semibold uppercase">Role</p>
                        <p className="font-semibold text-gray-900">{profileData.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition">
                  <p className="text-sm text-gray-600 mb-2 font-semibold uppercase">Actions Today</p>
                  <p className="text-4xl font-bold text-blue-600 mb-2">{profileStats.actionsToday}</p>
                  <div className="h-1 bg-linear-to-r from-blue-300 to-blue-600 rounded-full"></div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500 hover:shadow-md transition">
                  <p className="text-sm text-gray-600 mb-2 font-semibold uppercase">Users Managed</p>
                  <p className="text-4xl font-bold text-green-600 mb-2">{profileStats.usersManaged}</p>
                  <div className="h-1 bg-linear-to-r from-green-300 to-green-600 rounded-full"></div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500 hover:shadow-md transition">
                  <p className="text-sm text-gray-600 mb-2 font-semibold uppercase">Disputes Resolved</p>
                  <p className="text-4xl font-bold text-purple-600 mb-2">{profileStats.disputesResolved}</p>
                  <div className="h-1 bg-linear-to-r from-purple-300 to-purple-600 rounded-full"></div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500 hover:shadow-md transition">
                  <p className="text-sm text-gray-600 mb-2 font-semibold uppercase">Last Login</p>
                  <p className="text-lg font-bold text-orange-600">{profileStats.lastLogin || '—'}</p>
                  <div className="h-1 bg-linear-to-r from-orange-300 to-orange-600 rounded-full mt-2"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showAllActivities && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-linear-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity size={28} />
                All Activity History
              </h2>
              <button
                onClick={() => setShowAllActivities(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition"
              >
                <CheckCircle size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-3">
                {allActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      activity.type === 'venue' ? 'bg-primary-100' :
                      activity.type === 'dispute' ? 'bg-red-100' :
                      activity.type === 'user' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <activity.icon size={18} className={
                        activity.type === 'venue' ? 'text-primary-600' :
                        activity.type === 'dispute' ? 'text-red-600' :
                        activity.type === 'user' ? 'text-blue-600' : 'text-green-600'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setShowAllActivities(false)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-linear-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings size={28} />
                Edit Admin Profile
              </h2>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition"
              >
                <CheckCircle size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profileData.role}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Change Password (Optional)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowEditProfile(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle size={18} />
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
      <Footer />
    </div>
  );
};

export default AdminDashboard;

