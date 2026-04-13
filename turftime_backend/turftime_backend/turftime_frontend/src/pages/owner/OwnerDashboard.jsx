import { useState, useEffect } from 'react';
import { Calendar, IndianRupee, TrendingUp, Users, MapPin, Clock, Download, BarChart3, Settings, Eye, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import venueService from '../../services/venueService';
import bookingService from '../../services/bookingService';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayBookings, setTodayBookings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [stats, setStats] = useState([
    { label: 'Total Revenue',       value: '—', change: '', trend: 'neutral', subtext: 'all time',       icon: IndianRupee, bgGradient: 'from-green-500 to-emerald-600' },
    { label: 'Bookings This Month', value: '—', change: '', trend: 'neutral', subtext: 'this month',     icon: Calendar,    bgGradient: 'from-blue-500 to-blue-600' },
    { label: 'Active Venues',       value: '—', change: '', trend: 'neutral', subtext: 'operational',    icon: MapPin,      bgGradient: 'from-primary-500 to-primary-600' },
    { label: 'Total Customers',     value: '—', change: '', trend: 'neutral', subtext: 'unique players', icon: Users,       bgGradient: 'from-purple-500 to-purple-600' },
  ]);

  useEffect(() => {
    if (!user?.email) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // All dates from 1st of current month up to today
    const monthDates = [];
    const cursor = new Date(monthStart);
    while (cursor <= now) {
      monthDates.push(cursor.toISOString().split('T')[0]);
      cursor.setDate(cursor.getDate() + 1);
    }

    // Helper: compute hours between HH:MM:SS strings
    const hoursFromSlot = (start, end) => {
      try {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        return Math.max(((eh * 60 + em) - (sh * 60 + sm)) / 60, 0);
      } catch { return 1; }
    };

    const load = async () => {
      setLoading(true);
      try {
        // 1. Owner's venues
        const venueRes = await venueService.getVenuesByOwner(user.email);
        const ownerVenues = venueRes.success && Array.isArray(venueRes.data) ? venueRes.data : [];

        // 2. For each venue: fetch today's bookings + all days of current month in parallel
        const perVenueResults = await Promise.all(
          ownerVenues.map(async (v) => {
            // today filtered
            const todayRes = await bookingService.getBookingsByVenue(v.id, todayStr);
            // all month dates in parallel
            const monthRes = await Promise.all(
              monthDates.map(d => bookingService.getBookingsByVenue(v.id, d))
            );
            return { todayRes, monthRes, venue: v };
          })
        );

        // 3. Build sidebar venues list (from today's data)
        const sidebarVenues = perVenueResults.map(({ todayRes, venue: v }) => {
          const todayList = todayRes.success && Array.isArray(todayRes.data) ? todayRes.data : [];
          const pricePerHour = v.pricePerHour || v.price || 0;

          const todayRevenue = todayList.reduce((s, b) => {
            const hrs = hoursFromSlot(b.startTime || '00:00', b.endTime || '01:00');
            return s + (b.amount || pricePerHour * hrs);
          }, 0);
          const utilization = Math.min(Math.round((todayList.length / 12) * 100), 100);

          const nowTime = now.getHours() * 60 + now.getMinutes();
          const upcoming = todayList
            .filter(b => {
              const [h, m] = (b.startTime || '00:00').split(':').map(Number);
              return (h * 60 + m) >= nowTime;
            })
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
          const nextBooking = upcoming[0]?.startTime?.substring(0, 5) ?? null;

          return {
            id:            v.id,
            name:          v.name,
            bookingsToday: todayList.length,
            revenue:       `₹${todayRevenue.toLocaleString('en-IN')}`,
            status:        v.status?.toLowerCase() || 'active',
            utilization,
            nextBooking,
            pricePerHour,
          };
        });
        setVenues(sidebarVenues);

        // 4. Today's bookings table (all venues combined)
        const allTodayRaw = perVenueResults.flatMap(({ todayRes, venue: v }) => {
          const list = todayRes.success && Array.isArray(todayRes.data) ? todayRes.data : [];
          return list.map(b => ({
            id:       b.id,
            customer: b.playerName || b.playerEmail?.split('@')[0] || 'Guest',
            venue:    b.venueName || v.name,
            time:     `${(b.startTime || '').substring(0, 5)} - ${(b.endTime || '').substring(0, 5)}`,
            status:   b.status?.toLowerCase() || 'pending',
            amount:   b.amount || (v.pricePerHour || 0) * hoursFromSlot(b.startTime || '00:00', b.endTime || '01:00'),
          }));
        });
        setTodayBookings(allTodayRaw);

        // 5. Aggregate stats from all month days
        const allMonthBookings = perVenueResults.flatMap(({ monthRes, venue: v }) =>
          monthRes.flatMap(r => r.success && Array.isArray(r.data) ? r.data.map(b => ({ ...b, _pricePerHour: v.pricePerHour || v.price || 0 })) : [])
        );

        const totalRevenue = allMonthBookings.reduce((s, b) => {
          const hrs = hoursFromSlot(b.startTime || '00:00', b.endTime || '01:00');
          return s + (b.amount > 0 ? b.amount : b._pricePerHour * hrs);
        }, 0);
        const monthBookingCount   = allMonthBookings.length;
        const activeVenues        = ownerVenues.length;
        const uniqueCustomers     = new Set(allMonthBookings.map(b => b.playerEmail).filter(Boolean)).size;

        setStats([
          { label: 'Total Revenue',       value: `₹${totalRevenue.toLocaleString('en-IN')}`, trend: 'neutral', subtext: 'this month',              icon: IndianRupee, bgGradient: 'from-green-500 to-emerald-600' },
          { label: 'Bookings This Month', value: String(monthBookingCount),                   trend: 'neutral', subtext: `${allTodayRaw.length} today`, icon: Calendar,    bgGradient: 'from-blue-500 to-blue-600' },
          { label: 'Active Venues',       value: String(activeVenues),                        trend: 'neutral', subtext: `your venues`, icon: MapPin,  bgGradient: 'from-primary-500 to-primary-600' },
          { label: 'Total Customers',     value: String(uniqueCustomers),                     trend: 'neutral', subtext: 'this month',              icon: Users,       bgGradient: 'from-purple-500 to-purple-600' },
        ]);
      } catch (e) {
        console.error('Dashboard load error', e);
      }
      setLoading(false);
    };
    load();
  }, [user?.email]);

  const handleExport = () => {
    // Prepare CSV headers
    const headers = ['ID', 'Customer', 'Venue', 'Time Slot', 'Status', 'Amount (₹)'];
    
    // Prepare data rows
    const rows = todayBookings.map(booking => [
      booking.id,
      booking.customer,
      booking.venue,
      booking.time,
      booking.status.toUpperCase(),
      booking.amount
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Handle cells that contain commas or quotes
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `todays_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-linear-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                  <BarChart3 className="text-white" size={28} />
                </div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Owner Dashboard
                </h1>
              </div>
              <p className="text-gray-600 text-base ml-14">
                Welcome back! Here's what's happening with your venues today
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <Link 
                to="/owner/earnings" 
                className="flex items-center gap-2 bg-white text-gray-700 px-5 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg font-semibold border border-gray-200"
              >
                <IndianRupee size={20} />
                View Earnings
              </Link>
              <Link 
                to="/owner/venues" 
                className="flex items-center gap-2 bg-linear-to-r from-primary-600 to-primary-700 text-white px-5 py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
              >
                <Settings size={20} />
                Manage Venues
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-linear-to-br ${stat.bgGradient} rounded-xl shadow-md`}>
                    <IconComponent className="text-white" size={24} />
                  </div>
                  <div className="flex items-center gap-1">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="text-green-600" size={18} />
                    ) : stat.trend === 'down' ? (
                      <ArrowDownRight className="text-red-600" size={18} />
                    ) : null}
                    <span className={`text-sm font-bold ${
                      stat.trend === 'up' ? 'text-green-600' : 
                      stat.trend === 'down' ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                <p className="text-xs text-gray-500">{stat.subtext}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Bookings Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-linear-to-r from-gray-50 via-gray-100 to-gray-50 px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="text-primary-600" size={24} />
                      Today's Bookings
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {todayBookings.length} bookings scheduled for today
                    </p>
                  </div>
                  <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-semibold"
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <svg className="animate-spin w-8 h-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-bold text-xs text-gray-700 uppercase tracking-wider">Customer</th>
                      <th className="text-left py-4 px-6 font-bold text-xs text-gray-700 uppercase tracking-wider">Venue</th>
                      <th className="text-left py-4 px-6 font-bold text-xs text-gray-700 uppercase tracking-wider">Time Slot</th>
                      <th className="text-left py-4 px-6 font-bold text-xs text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="text-right py-4 px-6 font-bold text-xs text-gray-700 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {todayBookings.map((booking, index) => (
                      <tr 
                        key={booking.id} 
                        className={`hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-150 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-linear-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
                              <span className="text-white font-bold text-sm">
                                {booking.customer.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="ml-3 font-semibold text-gray-900">{booking.customer}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center text-sm text-gray-700">
                            <MapPin size={14} className="mr-2 text-gray-400" />
                            {booking.venue}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center text-sm text-gray-700">
                            <Clock size={14} className="mr-2 text-gray-400" />
                            {booking.time}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {booking.status === 'confirmed' ? (
                              <CheckCircle size={14} className="mr-1.5" />
                            ) : (
                              <AlertCircle size={14} className="mr-1.5" />
                            )}
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-bold text-lg text-green-700">
                            ₹{Math.round(booking.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}

              {!loading && todayBookings.length === 0 && (
                <div className="py-12 text-center">
                  <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500 text-lg font-medium">No bookings scheduled for today</p>
                  <p className="text-gray-400 text-sm mt-1">Check back later or view upcoming bookings</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* My Venues Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-linear-to-r from-primary-50 to-primary-100 px-6 py-5 border-b border-primary-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="text-primary-600" size={20} />
                    My Venues
                  </h2>
                  <Link 
                    to="/owner/venues" 
                    className="text-primary-700 hover:text-primary-800 text-sm font-bold flex items-center gap-1"
                  >
                    View All {venues.length > 0 ? `(${venues.length})` : ''}
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {venues.slice(0, 2).map(venue => (
                  <div 
                    key={venue.id} 
                    className="border-2 border-gray-100 rounded-xl p-4 hover:border-primary-200 hover:shadow-md transition-all duration-200 bg-linear-to-br from-white to-gray-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900 text-sm leading-snug pr-2">
                        {venue.name}
                      </h3>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1 ${
                        venue.status === 'active' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-orange-100 text-orange-800 border border-orange-200'
                      }`}>
                        <Activity size={12} />
                        {venue.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400" />
                          Bookings Today
                        </span>
                        <span className="font-bold text-gray-900">{venue.bookingsToday}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <IndianRupee size={14} className="text-gray-400" />
                          Today's Revenue
                        </span>
                        <span className="font-bold text-green-700">{venue.revenue}</span>
                      </div>

                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">Utilization</span>
                          <span className="font-bold text-gray-900">{venue.utilization}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              venue.utilization >= 80 ? 'bg-linear-to-r from-green-500 to-green-600' :
                              venue.utilization >= 50 ? 'bg-linear-to-r from-yellow-500 to-yellow-600' :
                              'bg-linear-to-r from-red-500 to-red-600'
                            }`}
                            style={{ width: `${venue.utilization}%` }}
                          ></div>
                        </div>
                      </div>

                      {venue.nextBooking && (
                        <div className="pt-2 text-xs text-gray-600 flex items-center gap-1">
                          <Clock size={12} className="text-gray-400" />
                          Next: {venue.nextBooking}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {venues.length > 2 && (
                  <Link
                    to="/owner/venues"
                    className="block text-center text-sm font-semibold text-primary-600 hover:text-primary-700 py-2 border-t border-gray-100 mt-1"
                  >
                    + {venues.length - 2} more venue{venues.length - 2 > 1 ? 's' : ''} · View All
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;

