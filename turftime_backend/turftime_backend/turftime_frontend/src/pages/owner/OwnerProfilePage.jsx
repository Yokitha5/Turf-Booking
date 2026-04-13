import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Calendar, IndianRupee, Users, BadgeCheck, Settings, BarChart3, TrendingUp, Clock, Star, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import EditOwnerProfileModal from '../../components/EditOwnerProfileModal';
import venueService from '../../services/venueService';
import bookingService from '../../services/bookingService';
import reviewService from '../../services/reviewService';

const hoursFromSlot = (start = '00:00', end = '00:00') => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(((eh * 60 + em) - (sh * 60 + sm)) / 60, 0);
};

const Pill = ({ children, variant = 'solid' }) => (
  <span className={
    variant === 'solid'
      ? 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700'
      : 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-primary-300 text-primary-700'
  }>
    {children}
  </span>
);

const Stat = ({ label, value }) => (
  <div className="text-center">
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

const VenueCard = ({ venue }) => (
  <div className="card p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-gray-900">{venue.name}</h4>
          {venue.featured && <Star className="text-yellow-500 fill-yellow-500" size={16} />}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <MapPin size={14} />
          <span>{venue.location}</span>
        </div>
        <Pill variant="outline">{venue.sport}</Pill>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">Status</p>
        <Pill>{venue.status}</Pill>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-100">
      <div className="text-center">
        <p className="text-lg font-bold text-gray-900">{venue.bookings}</p>
        <p className="text-xs text-gray-500">Bookings</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-900">{venue.occupancy}%</p>
        <p className="text-xs text-gray-500">Occupancy</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-900">₹{venue.revenue}K</p>
        <p className="text-xs text-gray-500">Revenue</p>
      </div>
    </div>

    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div 
        className="bg-primary-500 h-2 rounded-full transition-all duration-300" 
        style={{ width: `${venue.occupancy}%` }}
      ></div>
    </div>

    <div className="flex gap-2">
      <Link to={`/owner/schedule/${venue.id}`} className="flex-1 btn-secondary text-center py-2 text-sm">
        <Clock size={14} className="inline mr-1" />
        Schedule
      </Link>
    </div>
  </div>
);

const RecentBookingCard = ({ booking }) => (
  <div className="card p-4 flex items-center justify-between hover:shadow-md transition">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
        <Users className="text-primary-600" size={18} />
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{booking.customerName}</p>
        <p className="text-xs text-gray-500">{booking.venueName}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-semibold text-gray-900">₹{booking.amount}</p>
      <p className="text-xs text-gray-500">{booking.date}</p>
    </div>
  </div>
);

const OwnerProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [ownerVenues,    setOwnerVenues]    = useState([]);
  const [earningsSummary, setEarningsSummary] = useState([
    { period: 'Today',      amount: '—', color: 'text-green-600' },
    { period: 'This Week',  amount: '—', color: 'text-green-600' },
    { period: 'This Month', amount: '—', color: 'text-green-600' },
  ]);
  const [businessMetrics, setBusinessMetrics] = useState({
    totalVenues: 0, activeBookings: 0, totalRevenue: '—', avgRating: '—', totalCustomers: 0,
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        let ownerEmail = user?.email || user?.sub || '';
        if (!ownerEmail.includes('@')) ownerEmail = `${ownerEmail}@turftime.in`;

        const venuesRes = await venueService.getVenuesByOwner(ownerEmail);
        if (!venuesRes.success) return;
        const venues = venuesRes.data || [];

        // ── Concurrency limiter: runs at most `limit` requests at a time ──
        const fetchLimited = async (tasks, limit = 8) => {
          const results = new Array(tasks.length);
          let idx = 0;
          const worker = async () => {
            while (idx < tasks.length) {
              const i = idx++;
              results[i] = await tasks[i]();
            }
          };
          await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
          return results;
        };

        const fmt = (d) =>
          `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

        const today = new Date();
        const todayStr = fmt(today);

        // Week start (Monday)
        const dow = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((dow + 6) % 7));
        const weekStartStr = fmt(monday);

        // Month start
        const monthStartStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`;

        // Build date list: last 90 days (today – 89 → today) for all-time stats,
        // which also covers this-week and this-month as subsets.
        const allDates = Array.from({ length: 90 }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() - (89 - i));
          return fmt(d);
        });

        const toList = (res) => (res?.success && Array.isArray(res.data) ? res.data : []);
        const isActive = (b) => ['confirmed','completed'].includes(b.status?.toLowerCase());
        const calcRev = (list, pph) =>
          list.filter(isActive).reduce((s, b) => s + (pph||0) * hoursFromSlot(b.startTime, b.endTime), 0);

        // Build one task per (venue × date), plus rating tasks — run all with limit=8
        const perVenue = await Promise.all(venues.map(async (v) => {
          // Fetch all dates for this venue with concurrency limit
          const tasks = allDates.map(d => () => bookingService.getBookingsByVenue(v.id, d));
          const [dateResults, ratingRes] = await Promise.all([
            fetchLimited(tasks, 8),
            reviewService.getAverageRating(v.id),
          ]);

          const allList = dateResults.flatMap(r => toList(r));

          // Filter client-side by date ranges
          const inRange = (b, from, to) => {
            const d = (b.bookingDate || b.date || '').slice(0, 10);
            return d >= from && d <= to;
          };

          const todayList  = allList.filter(b => inRange(b, todayStr, todayStr));
          const weekList   = allList.filter(b => inRange(b, weekStartStr, todayStr));
          const monthList  = allList.filter(b => inRange(b, monthStartStr, todayStr));

          const todayRev        = calcRev(todayList,  v.pricePerHour);
          const weekRev         = calcRev(weekList,   v.pricePerHour);
          const monthRev        = calcRev(monthList,  v.pricePerHour);
          const allTimeRev      = calcRev(allList,    v.pricePerHour);
          const allBookings     = allList.filter(isActive).length;
          const uniqueCustomers = new Set(allList.filter(isActive).map(b => b.playerEmail)).size;
          const monthBookings   = monthList.filter(isActive).length;

          return {
            venue: v,
            allTimeRev,
            todayRev,
            weekRev,
            monthRev,
            monthBookings,
            allBookings,
            uniqueCustomers,
            avgRating: ratingRes.success && typeof ratingRes.data === 'number' ? ratingRes.data : 0,
          };
        }));

        // Aggregate
        const totalAllTime  = Math.round(perVenue.reduce((s,v) => s + v.allTimeRev,       0));
        const totalToday    = Math.round(perVenue.reduce((s,v) => s + v.todayRev,          0));
        const totalWeek     = Math.round(perVenue.reduce((s,v) => s + v.weekRev,           0));
        const totalMonth    = Math.round(perVenue.reduce((s,v) => s + v.monthRev,          0));
        const totalBookings = perVenue.reduce((s,v) => s + v.allBookings,       0);
        const totalCustomers= perVenue.reduce((s,v) => s + v.uniqueCustomers,   0);
        const maxVenueRev   = Math.max(...perVenue.map(v => v.allTimeRev), 1);

        const fmtRev = (n) =>
          n >= 100000 ? `₹${(n/100000).toFixed(1)}L` :
          n >= 1000   ? `₹${(n/1000).toFixed(1)}k`   : `₹${n}`;

        const ratingVals = perVenue.map(v => v.avgRating).filter(r => r > 0);
        const avgRating  = ratingVals.length
          ? (ratingVals.reduce((s,r) => s+r, 0) / ratingVals.length).toFixed(1)
          : '—';

        // Build venue cards with real data
        setOwnerVenues(perVenue.map(pv => ({
          id:        pv.venue.id,
          name:      pv.venue.name,
          location:  pv.venue.location || pv.venue.city || '',
          sport:     pv.venue.sport || '',
          bookings:  pv.monthBookings,
          occupancy: Math.min(Math.round((pv.monthBookings / Math.max(today.getDate() * 8, 1)) * 100), 100),
          revenue:   Math.round(pv.allTimeRev / 1000),   // in K
          revenueRaw: Math.round(pv.allTimeRev),
          maxRev:    maxVenueRev,
          status:    'Active',
          featured:  false,
        })));

        setEarningsSummary([
          { period: 'Today',      amount: fmtRev(totalToday), color: 'text-green-600' },
          { period: 'This Week',  amount: fmtRev(totalWeek),  color: 'text-green-600' },
          { period: 'This Month', amount: fmtRev(totalMonth), color: 'text-green-600' },
        ]);

        setBusinessMetrics({
          totalVenues:    venues.length,
          activeBookings: totalBookings,
          totalRevenue:   fmtRev(totalAllTime),
          avgRating,
          totalCustomers,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) {
    return <div className="page-bg py-8"><div className="container-page text-center">Loading...</div></div>;
  }

  return (
    <>
      <div className="page-bg py-8">
        <div className="container-page">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="card p-8 bg-linear-to-r from-green-50 to-primary-100 border-l-4 border-green-500">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-green-500 shrink-0">
                      <IndianRupee className="text-green-600" size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                        <BadgeCheck className="text-green-600" size={20} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="text-gray-700 text-sm">{user.email}</span>
                        {user.location && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin size={13} />{user.location}
                          </span>
                        )}
                        {user.phone && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone size={13} />{user.phone}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Pill>Venue Owner</Pill>
                        <Pill variant="outline">Verified Business</Pill>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsEditModalOpen(true)} className="p-2 hover:bg-white rounded-lg border border-green-300">
                    <Settings size={20} className="text-green-600" />
                  </button>
                </div>

                  <div className="grid grid-cols-3 gap-6 pt-6 border-t border-green-200">
                  <Stat label="Active Venues" value={loading ? '—' : businessMetrics.totalVenues} />
                  <Stat label="Total Bookings" value={loading ? '—' : businessMetrics.activeBookings} />
                  <Stat label="Avg Rating" value={loading ? '—' : businessMetrics.avgRating} />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <BarChart3 className="text-blue-600 shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Business Dashboard</h3>
                    <p className="text-sm text-blue-700">View comprehensive analytics, revenue tracking, and booking management.</p>
                  </div>
                </div>
                <Link to="/owner/dashboard" className="btn-primary px-6 py-2 whitespace-nowrap">
                  Go to Dashboard
                </Link>
              </div>
              <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Earnings Summary</h3>
                    <Link to="/owner/earnings" className="text-primary-600 text-sm font-semibold hover:text-primary-700">
                      Full Report →
                    </Link>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {earningsSummary.map((item, idx) => (
                      <div key={idx} className="card p-6">
                        <p className="text-sm text-gray-500 mb-1">{item.period}</p>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{item.amount}</p>
                      </div>
                    ))}
                  </div>

                  <div className="card p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Revenue by Venue</h4>
                    {loading ? (
                      <p className="text-sm text-gray-400">Loading...</p>
                    ) : ownerVenues.length === 0 ? (
                      <p className="text-sm text-gray-400">No venues found.</p>
                    ) : (
                      <div className="space-y-4">
                        {ownerVenues.map(venue => (
                          <div key={venue.id}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-700">{venue.name}</span>
                              <span className="text-sm font-semibold text-gray-900">₹{venue.revenue}K</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${Math.round((venue.revenueRaw / venue.maxRev) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
            </div>
            <div>
              <div className="card p-8 bg-linear-to-br from-green-900 to-green-800 text-white rounded-lg sticky top-20">
                <h3 className="text-sm font-semibold text-green-300 mb-6">BUSINESS OVERVIEW</h3>
                <div className="space-y-6">
                  <div className="border-b border-green-700 pb-6">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-3xl font-bold">{businessMetrics.totalRevenue}</p>
                      <TrendingUp className="text-green-400" size={20} />
                    </div>
                    <p className="text-sm text-green-300">Total Revenue</p>
                    <p className="text-xs text-green-400 mt-1">all time</p>
                  </div>
                  <div className="border-b border-green-700 pb-6">
                    <p className="text-3xl font-bold mb-1">{businessMetrics.totalVenues}</p>
                    <p className="text-sm text-green-300">Active Venues</p>
                  </div>
                  <div className="border-b border-green-700 pb-6">
                    <p className="text-3xl font-bold mb-1">{businessMetrics.activeBookings}</p>
                    <p className="text-sm text-green-300">Total Bookings</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold mb-1">{businessMetrics.totalCustomers}</p>
                    <p className="text-sm text-green-300">Happy Customers</p>
                  </div>
                </div>
                <Link to="/owner/earnings" className="w-full btn-primary mt-6 block text-center">
                  Download Report
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditOwnerProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSave={updateProfile}
      />
    </>
  );
};

export default OwnerProfilePage;

