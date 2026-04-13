import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, TrendingUp, Calendar, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import venueService from '../../services/venueService';
import bookingService from '../../services/bookingService';

const hoursFromSlot = (start = '00:00', end = '00:00') => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(((eh * 60 + em) - (sh * 60 + sm)) / 60, 0);
};

const fmtRupees = (n) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` :
  n >= 1000   ? `₹${(n / 1000).toFixed(1)}k`    :
  `₹${n}`;

const EarningsPage = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);

  const [totalEarnings,  setTotalEarnings]  = useState(0);
  const [monthEarnings, setMonthEarnings] = useState(0);
  const [weekEarnings, setWeekEarnings]   = useState(0);
  const [weeklyData,   setWeeklyData]     = useState([]);
  const [monthlyData,  setMonthlyData]    = useState([]);
  const [venueEarnings, setVenueEarnings] = useState([]);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

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

        const today = new Date();

        // Current week Mon-Sun
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
        const weekDates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          return d.toISOString().split('T')[0];
        });
        const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // Current month days up to today
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = today.getDate();
        const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
          const d = new Date(year, month, i + 1);
          return d.toISOString().split('T')[0];
        });

        // Helper: extract booking list from service response
        const toList = (res) => (res?.success ? (Array.isArray(res.data) ? res.data : []) : []);
        const isActive = (b) => ['confirmed', 'completed'].includes(b.status?.toLowerCase());
        const calcRev = (bookings, pricePerHour) =>
          bookings.filter(isActive).reduce((s, b) => s + pricePerHour * hoursFromSlot(b.startTime, b.endTime), 0);

        // Fetch per venue: all-time + week + month
        const perVenue = await Promise.all(venues.map(async (v) => {
          const [allTimeRes, weekResults, monthResults] = await Promise.all([
            bookingService.getBookingsByVenue(v.id),                                          // all-time (no date)
            Promise.all(weekDates.map(d => bookingService.getBookingsByVenue(v.id, d))),
            Promise.all(monthDates.map(d => bookingService.getBookingsByVenue(v.id, d))),
          ]);

          const allTimeBookings = toList(allTimeRes);
          const allTimeRev = calcRev(allTimeBookings, v.pricePerHour || 0);

          const weekRevPerDay  = weekResults.map(r  => {
            const list = toList(r);
            return { rev: calcRev(list, v.pricePerHour || 0), count: list.filter(isActive).length };
          });
          const monthRevPerDay = monthResults.map(r => {
            const list = toList(r);
            return { rev: calcRev(list, v.pricePerHour || 0), count: list.filter(isActive).length };
          });

          // Ensure week revenue ≤ month revenue (week is always subset of month)
          const totalWeekRev  = weekRevPerDay.reduce((s, d) => s + d.rev, 0);
          const totalMonthRev = monthRevPerDay.reduce((s, d) => s + d.rev, 0);
          // All-time must be ≥ month; use max to guard against API inconsistencies
          const safeAllTime = Math.max(allTimeRev, totalMonthRev);

          return {
            venue: v,
            weekRevPerDay,
            monthRevPerDay,
            totalWeekRev,
            totalMonthRev,
            allTimeRev: safeAllTime,
          };
        }));

        // Weekly chart (Mon-Sun)
        const wData = weekDayNames.map((name, i) => ({
          name,
          earnings: Math.round(perVenue.reduce((s, v) => s + v.weekRevPerDay[i].rev,   0)),
          bookings:             perVenue.reduce((s, v) => s + v.weekRevPerDay[i].count, 0),
        }));

        // Monthly chart grouped by week within the month
        const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
        const mData = weekLabels.map((name, wi) => {
          const start = wi * 7;
          const end   = Math.min((wi + 1) * 7, monthDates.length);
          if (start >= monthDates.length) return null;
          return {
            name,
            earnings: Math.round(perVenue.reduce((s, v) => s + v.monthRevPerDay.slice(start, end).reduce((a, d) => a + d.rev,   0), 0)),
            bookings:             perVenue.reduce((s, v) => s + v.monthRevPerDay.slice(start, end).reduce((a, d) => a + d.count, 0), 0),
          };
        }).filter(Boolean);

        const totalAllTime  = Math.round(perVenue.reduce((s, v) => s + v.allTimeRev,    0));
        const totalMonthRev = Math.round(perVenue.reduce((s, v) => s + v.totalMonthRev, 0));
        // Week is a subset of month; cap to avoid showing more than month
        const totalWeekRev  = Math.min(
          Math.round(perVenue.reduce((s, v) => s + v.totalWeekRev, 0)),
          totalMonthRev
        );

        const venueEarningsData = perVenue
          .filter(v => v.totalMonthRev > 0)
          .map(v => ({ name: v.venue.name, value: Math.round(v.totalMonthRev) }));

        setWeeklyData(wData);
        setMonthlyData(mData.length ? mData : [{ name: 'This Month', earnings: totalMonthRev, bookings: 0 }]);
        setVenueEarnings(venueEarningsData);
        setTotalEarnings(totalAllTime);
        setMonthEarnings(totalMonthRev);
        setWeekEarnings(totalWeekRev);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const currentChartData = dateRange === 'week' ? weeklyData : monthlyData;

  const stats = [
    { label: 'Total Earnings', value: loading ? '—' : `₹${totalEarnings.toLocaleString('en-IN')}`,  icon: <IndianRupee className="text-green-600" />,  subtext: 'all time' },
    { label: 'This Month',     value: loading ? '—' : `₹${monthEarnings.toLocaleString('en-IN')}`,  icon: <Calendar     className="text-blue-600" />,   subtext: 'current month' },
    { label: 'This Week',      value: loading ? '—' : `₹${weekEarnings.toLocaleString('en-IN')}`,   icon: <TrendingUp   className="text-purple-600" />, subtext: 'Mon – Sun' },
  ];

  const handleDownloadReport = () => {
    const csvData = [];
    csvData.push(['TurfTime - Earnings & Analytics Report']);
    csvData.push(['Generated on:', new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })]);
    csvData.push([]);
    csvData.push(['Summary Statistics']);
    csvData.push(['Metric', 'Value']);
    stats.forEach(stat => csvData.push([stat.label, stat.value]));
    csvData.push([]);
    csvData.push(['Revenue Trend (' + dateRange.charAt(0).toUpperCase() + dateRange.slice(1) + ')']);
    csvData.push(['Period', 'Earnings (₹)', 'Bookings']);
    currentChartData.forEach(item => csvData.push([item.name, item.earnings, item.bookings]));
    csvData.push([]);
    csvData.push(['Earnings by Venue']);
    csvData.push(['Venue Name', 'Total Earnings (₹)', 'Percentage']);
    const totalVenueEarnings = venueEarnings.reduce((sum, v) => sum + v.value, 0);
    venueEarnings.forEach(v => csvData.push([v.name, v.value, ((v.value / (totalVenueEarnings || 1)) * 100).toFixed(1) + '%']));
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `turftime-earnings-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings & Analytics</h1>
            <p className="text-gray-600">Track your revenue and booking performance</p>
          </div>
          <button
            onClick={handleDownloadReport}
            className="btn-primary flex items-center space-x-2"
          >
            <Download size={20} />
            <span>Download Report</span>
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  {stat.icon}
                </div>
                <span className="text-gray-400 text-xs">{stat.subtext}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Revenue Trend</h2>
              <div className="flex space-x-2">
                {['week', 'month'].map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      dateRange === range
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={currentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Earnings (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Earnings by Venue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={venueEarnings}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₹${value/1000}k`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {venueEarnings.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Bookings Per Day</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="bookings" fill="#10b981" name="Number of Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EarningsPage;

