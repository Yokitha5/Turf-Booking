import { Calendar, Clock, MapPin, Users, Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { disputeService } from '../../services/disputeService';
import bookingService from '../../services/bookingService';
import venueService from '../../services/venueService';
import { getMyTeams } from '../../services/teamService';

const PlayerDashboard = () => {
  const { user, token } = useAuth();

  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [myDisputes, setMyDisputes] = useState([]);
  const [stats, setStats] = useState([
    { label: 'Total Bookings', value: '—', icon: <Calendar className="text-primary-800" />, gradient: 'from-primary-500/25 via-primary-600/20 to-primary-700/25' },
    { label: 'Teams Joined',   value: '—', icon: <Users className="text-emerald-800" />,  gradient: 'from-emerald-500/25 via-emerald-600/20 to-emerald-700/25' },
    { label: 'Matches Played', value: '—', icon: <Trophy className="text-amber-800" />,   gradient: 'from-amber-500/25 via-amber-600/20 to-amber-700/25' },
    { label: 'Total Spent',    value: '—', icon: <TrendingUp className="text-teal-800" />, gradient: 'from-teal-500/25 via-teal-600/20 to-teal-700/25' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [bookingRes, teamsData, disputeRes] = await Promise.allSettled([
          bookingService.getBookingsByPlayer(user.email),
          getMyTeams(user.email, token).catch(() => []),
          disputeService.getMyDisputes(user.email),
        ]);

        // ── Teams ─────────────────────────────────────────────────────────
        const teamsArr = teamsData.status === 'fulfilled'
          ? (Array.isArray(teamsData.value) ? teamsData.value : [])
          : [];
        setMyTeams(teamsArr);

        // ── Disputes ──────────────────────────────────────────────────────
        if (disputeRes.status === 'fulfilled') {
          const dr = disputeRes.value;
          if (dr.success && Array.isArray(dr.data)) setMyDisputes(dr.data);
        }

        // ── Bookings ──────────────────────────────────────────────────────
        if (bookingRes.status === 'fulfilled' && bookingRes.value.success) {
          const raw = bookingRes.value.data;

          // Resolve venue names (try cache first, then API)
          const venueCache = JSON.parse(localStorage.getItem('venueCache') || '{}');
          const uniqueVenueIds = [...new Set(raw.map(b => b.venueId).filter(Boolean))];
          const venueMap = {};

          await Promise.all(uniqueVenueIds.map(async (vid) => {
            const vr = await venueService.getVenueById(vid).catch(() => null);
            if (vr?.success) venueMap[vid] = vr.data;
          }));

          const mapped = raw.map(b => {
            const v = venueMap[b.venueId] || {};
            const cached = venueCache[b.id] || {};
            const startTime = b.startTime?.substring(0, 5) || '00:00';
            const endTime   = b.endTime?.substring(0, 5)   || '00:00';
            return {
              id:       b.id,
              venue:    b.venueName    || cached.venueName    || v.name     || 'Unknown Venue',
              location: b.venueLocation|| cached.venueLocation|| v.location || v.city || '',
              date:     b.bookingDate,
              time:     `${startTime} - ${endTime}`,
              status:   b.status?.toLowerCase() || 'pending',
              price:    b.amount       || cached.price        || v.pricePerHour || 0,
            };
          });

          // Upcoming: today or future
          const upcoming = mapped
            .filter(b => {
              const d = new Date(b.date);
              return d >= today && b.status !== 'cancelled';
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 2);
          setUpcomingBookings(upcoming);

          // Stats
          const totalSpent = mapped
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + Number(b.price || 0), 0);
          const matchesPlayed = mapped.filter(b => {
            const d = new Date(b.date);
            return d < today && b.status === 'confirmed';
          }).length;

          setStats([
            { label: 'Total Bookings', value: raw.length,         icon: <Calendar className="text-primary-800" />, gradient: 'from-primary-500/25 via-primary-600/20 to-primary-700/25' },
            { label: 'Teams Joined',   value: teamsArr.length,    icon: <Users className="text-emerald-800" />,    gradient: 'from-emerald-500/25 via-emerald-600/20 to-emerald-700/25' },
            { label: 'Matches Played', value: matchesPlayed,      icon: <Trophy className="text-amber-800" />,     gradient: 'from-amber-500/25 via-amber-600/20 to-amber-700/25' },
            { label: 'Total Spent',    value: `₹${totalSpent.toLocaleString('en-IN')}`, icon: <TrendingUp className="text-teal-800" />, gradient: 'from-teal-500/25 via-teal-600/20 to-teal-700/25' },
          ]);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user, token]);

  return (
    <div className="page-bg relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none mix-blend-multiply">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary-300/22 blur-3xl" />
        <div className="absolute right-0 top-6 h-64 w-64 rounded-full bg-emerald-300/22 blur-3xl" />
        <div className="absolute left-12 bottom-6 h-96 w-96 rounded-full bg-teal-300/18 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-2 mb-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Player Dashboard</h1>
          <p className="text-sm text-primary-800/80">Welcome back! Here's your activity overview.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-7">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="card p-5 border-primary-500/15 bg-white/92 text-primary-900 shadow-xl"
              style={{
                boxShadow: '0 12px 38px rgba(13, 63, 41, 0.14)',
                backgroundImage:
                  'linear-gradient(135deg, rgba(44,169,107,0.06) 0%, rgba(12,77,52,0.04) 60%, rgba(44,169,107,0.02) 100%)'
              }}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-linear-to-br ${stat.gradient} mb-3 shadow-inner shadow-primary-900/10`}>
                {stat.icon}
              </div>
              <p className="text-lg font-bold text-primary-900 mb-0">{stat.value}</p>
              <p className="text-xs text-primary-700/80">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-7">
          <div className="lg:col-span-1">
            <div className="card p-5 bg-white/94 border-primary-100/60 shadow-xl shadow-primary-900/12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-primary-900">Upcoming Bookings</h2>
                <Link to="/player/bookings" className="text-primary-600 hover:text-primary-700 font-medium">
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {loading && (
                  <div className="space-y-3">
                    {[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-primary-50 animate-pulse" />)}
                  </div>
                )}
                {!loading && upcomingBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="border border-primary-100/80 rounded-xl p-4 hover:shadow-lg hover:shadow-primary-900/12 transition bg-white/88"
                    style={{ backgroundImage: 'linear-gradient(135deg, rgba(44,169,107,0.05), rgba(12,77,52,0.02))' }}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <h3 className="font-semibold text-primary-900 mb-1">{booking.venue}</h3>
                        <div className="flex items-center text-sm text-primary-700/80 mb-1">
                          <MapPin size={14} className="mr-1" />
                          <span>{booking.location}</span>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4 text-primary-700/80">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <span>{new Date(booking.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          <span>{booking.time}</span>
                        </div>
                      </div>
                      <span className="font-semibold text-primary-700">₹{booking.price}</span>
                    </div>
                  </div>
                ))}

                {!loading && upcomingBookings.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No upcoming bookings</p>
                    <Link to="/venues" className="btn-primary">
                      Book a Venue
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-5 bg-white/94 border-primary-100/60 shadow-xl shadow-primary-900/12 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-primary-900">My Teams</h2>
                <Link to="/player/teams" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {loading && (
                  <div className="space-y-3">
                    {[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-primary-50 animate-pulse" />)}
                  </div>
                )}
                {!loading && myTeams.slice(0, 2).map(team => (
                  <div key={team.id} className="border border-primary-100/80 rounded-xl p-4 bg-white/80">
                    <h3 className="font-semibold text-primary-900 mb-1">{team.name}</h3>
                    <p className="text-sm text-primary-700/80 mb-1">{team.sport}</p>
                    <div className="flex items-center text-sm text-primary-700/80">
                      <Users size={14} className="mr-1" />
                      <span>{team.memberCount ?? team.memberEmails?.length ?? 0} members</span>
                    </div>
                  </div>
                ))}
                {!loading && myTeams.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 mb-3">No teams yet</p>
                    <Link to="/player/teams" className="text-primary-600 text-sm font-medium hover:underline">Browse Teams</Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-5 bg-white/94 border-primary-100/60 shadow-xl shadow-primary-900/12 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-primary-600" />
                  <h2 className="text-xl font-bold text-primary-900">Disputes</h2>
                </div>
              </div>

              {myDisputes.length > 0 ? (
                <div className="mb-4 space-y-2">
                  {myDisputes.slice(0, 2).map((dispute, idx) => {
                    const statusColor = dispute.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : dispute.status === 'REJECTED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-800';
                    return (
                      <div key={dispute.id || idx} className="border border-primary-100/80 rounded-xl p-4 bg-white/80">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-primary-900 text-sm truncate max-w-[65%]">{dispute.venueName || dispute.venue || 'Venue'}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{dispute.status || 'PENDING'}</span>
                        </div>
                        <p className="text-xs text-primary-700/70 truncate">{dispute.issue || dispute.reason || 'Dispute raised'}</p>
                        {dispute.createdAt && (
                          <p className="text-xs text-primary-500 mt-1">{new Date(dispute.createdAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    );
                  })}
                  {myDisputes.length > 2 && (
                    <p className="text-xs text-primary-500 mt-2 text-center">+{myDisputes.length - 2} more dispute{myDisputes.length - 2 > 1 ? 's' : ''}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-primary-700/70 leading-relaxed mb-4">
                  Raise and track disputes for your bookings, request refunds, or communicate with the venue owner and admin.
                </p>
              )}
              <Link to="/player/disputes"
                className="mt-4 flex items-center justify-center gap-2 w-full bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 px-4 py-2 rounded-lg text-sm font-semibold transition">
                <AlertCircle size={14} /> View My Disputes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
