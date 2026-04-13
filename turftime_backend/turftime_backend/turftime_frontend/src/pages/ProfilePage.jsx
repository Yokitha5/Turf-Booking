import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, Clock, CreditCard, Share2, Users, BadgeCheck, Settings, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import EditProfileModal from '../components/EditProfileModal';
import {
  getPendingInvites, acceptInvite, declineInvite,
  getAvailableTeams, acceptJoinRequest, declineJoinRequest, getMyTeams
} from '../services/teamService';
import bookingService from '../services/bookingService';
import venueService from '../services/venueService';

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
  <div className="text-center px-2">
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

const BookingCard = ({ title, price, status, date, time, location, ctaLabel, onCTAClick }) => (
  <div className="card p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <Users className="text-primary-600" size={18} />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <Pill>{status}</Pill>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">INR {price}</p>
        <p className="text-xs text-gray-500">Paid</p>
      </div>
    </div>

    <div className="space-y-2 text-sm text-gray-700">
      <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> <span>{date} · {time}</span></div>
      <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> <span>{location}</span></div>
    </div>

    <div className="flex items-center justify-between mt-2">
      <button onClick={onCTAClick} className="btn-primary px-6 py-2">{ctaLabel}</button>
      <button className="border border-gray-300 rounded-full p-2 hover:bg-gray-50"><Share2 size={18} className="text-gray-600" /></button>
    </div>
  </div>
);



const ProfilePage = () => {
  const { user, token, updateProfile } = useAuth();
  const [activeStatus, setActiveStatus] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('myTeams');

  // ── Invites from backend (captain invited ME) ──────────────────────────────
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  // ── Real bookings ──────────────────────────────────────────────────────────
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [totalBookings, setTotalBookings] = useState(0);

  // ── Real teams count ─────────────────────────────────────────────────────
  const [totalTeams, setTotalTeams] = useState(0);

  useEffect(() => {
    if (!user?.email || !token) return;
    getMyTeams(user.email, token)
      .then(data => setTotalTeams(Array.isArray(data) ? data.length : 0))
      .catch(() => setTotalTeams(0));
  }, [user?.email, token]);

  useEffect(() => {
    if (!user?.email) return;
    setBookingsLoading(true);
    const fetchBookings = async () => {
      try {
        const result = await bookingService.getBookingsByPlayer(user.email);
        if (result.success) {
          const bookingsData = Array.isArray(result.data) ? result.data : [];
          setTotalBookings(bookingsData.length);

          const uniqueVenueIds = [...new Set(bookingsData.map(b => b.venueId).filter(Boolean))];
          const venueResults = await Promise.all(uniqueVenueIds.map(id => venueService.getVenueById(id)));
          const venueMap = {};
          venueResults.forEach((res, i) => { if (res.success) venueMap[uniqueVenueIds[i]] = res.data; });

          const venueCache = JSON.parse(localStorage.getItem('venueCache') || '{}');
          const today = new Date(); today.setHours(0, 0, 0, 0);

          const upcoming = bookingsData
            .map(booking => {
              const venue = venueMap[booking.venueId] || {};
              const cached = venueCache[booking.id] || {};
              const startTime = booking.startTime?.substring(0, 5) || '00:00';
              const endTime   = booking.endTime?.substring(0, 5)   || '00:00';
              return {
                id:       booking.id,
                venue:    booking.venueName    || cached.venueName    || venue.name     || 'Unknown Venue',
                date:     booking.bookingDate,
                time:     `${startTime} - ${endTime}`,
                location: booking.venueLocation || cached.venueLocation || venue.location || venue.city || 'Unknown',
                status:   booking.status?.toLowerCase(),
                price:    booking.amount || cached.price || venue.pricePerHour || 0,
                sport:    booking.sport  || cached.sport  || venue.sport || 'General',
                venueId:  booking.venueId || cached.venueId,
              };
            })
            .filter(b => {
              const d = new Date(b.date); d.setHours(0, 0, 0, 0);
              return d >= today && (b.status === 'confirmed' || b.status === 'pending');
            });

          setUpcomingBookings(upcoming);
        }
      } catch (_) {}
      setBookingsLoading(false);
    };
    fetchBookings();
  }, [user?.email]);

  useEffect(() => {
    if (activeTab !== 'invites' || !user?.email || !token) return;
    setInvitesLoading(true);
    getPendingInvites(user.email, token)
      .then(data => setInvites(Array.isArray(data) ? data : []))
      .catch(() => setInvites([]))
      .finally(() => setInvitesLoading(false));
  }, [activeTab, user?.email, token]);

  const handleAcceptInvite = async (inviteId) => {
    try {
      await acceptInvite(String(inviteId), user.email, token);
    } catch (_) { /* show optimistic update anyway */ }
    setInvites(prev => prev.filter(inv => inv.id !== inviteId));
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      await declineInvite(String(inviteId), user.email, token);
    } catch (_) {}
    setInvites(prev => prev.filter(inv => inv.id !== inviteId));
  };

  const handleSaveProfile = async (profileData) => {
    try {
      updateProfile(profileData);
    } catch (error) {
    }
  };

  const handleGetDirections = (location) => {
    const encodedLocation = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
  };

  return (
    <>
      <div className="page-bg py-8">
        <div className="container-page">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="space-y-6 lg:sticky lg:top-8">
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                      {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{user?.name || 'Player Name'}</h2>
                    <p className="text-sm text-gray-600">{user?.role || 'PLAYER'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Pill><BadgeCheck size={14} className="mr-1" /> Pro Member</Pill>
                </div>
                {user?.bio && (
                  <p className="mt-4 text-sm text-gray-700 leading-relaxed">{user.bio}</p>
                )}
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="mt-6 w-full bg-gray-100 text-gray-900 rounded-full py-2 font-semibold hover:bg-gray-200 transition">
                  Edit Profile
                </button>
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
                  <Stat label="Bookings" value={totalBookings} />
                  <Stat label="Teams" value={totalTeams} />
                  <Stat label="Jersey" value={user?.jersey ? `#${user.jersey}` : '—'} />
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">Player Details</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {user?.skills?.map(skill => (
                    <Pill key={skill} variant="outline">{skill}</Pill>
                  ))}
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> Location {': '}{user?.location || 'Mumbai, India'}</div>
                  <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> Availability {': '}{user?.availability || 'Weeknights'}</div>
                  <div className="flex items-center gap-2"><Users size={16} className="text-gray-400" /> Jersey {': '}{user?.jersey || '#10'}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6 bg-linear-to-r from-primary-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 mb-3">
                      <Users size={16} className="text-primary-600" />
                      <span className="text-sm font-semibold text-gray-900">Looking for an Opponent?</span>
                    </div>
                    <p className="text-gray-600">Broadcast your availability to find a match nearby for your active teams.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">Status:</span>
                    <button
                      onClick={() => setActiveStatus(!activeStatus)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full ${activeStatus ? 'bg-primary-500' : 'bg-gray-300'}`}
                      aria-label="Toggle status"
                    >
                      <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${activeStatus ? 'translate-x-7' : 'translate-x-1'}`}></span>
                    </button>
                    <span className="text-sm">{activeStatus ? 'Active' : 'Offline'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm border-b border-gray-200">
                <button 
                  onClick={() => setActiveTab('myTeams')}
                  className={`pb-3 transition ${activeTab === 'myTeams' ? 'font-semibold text-primary-600 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Upcoming
                </button>
                <button 
                  onClick={() => setActiveTab('invites')}
                  className={`pb-3 transition ${activeTab === 'invites' ? 'font-semibold text-primary-600 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Team Invites
                  {invites.length > 0 && (
                    <span className="ml-1 inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">{invites.length}</span>
                  )}
                </button>
              </div>

              {activeTab === 'myTeams' && (
                <>
                  <h3 className="font-bold text-gray-900">My Bookings</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {bookingsLoading ? (
                          <div className="col-span-2 flex justify-center py-12">
                            <svg className="animate-spin w-8 h-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                          </div>
                        ) : upcomingBookings.length > 0 ? (
                          upcomingBookings.map(booking => (
                            <div key={booking.id} className="card flex flex-col overflow-hidden min-h-80">
                              {/* Card Header */}
                              <div className="px-5 pt-5 pb-4 flex items-start">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                    <Users className="text-primary-600" size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{booking.venue}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{booking.sport || 'General'}</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 mt-1.5">
                                      {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {/* Divider */}
                              <div className="mx-5 border-t border-gray-100" />
                              {/* Details */}
                              <div className="px-5 py-4 flex-1 space-y-2.5">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar size={14} className="text-primary-400 shrink-0" />
                                  <span>{new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock size={14} className="text-primary-400 shrink-0" />
                                  <span>{booking.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin size={14} className="text-primary-400 shrink-0" />
                                  <span className="truncate">{booking.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <CreditCard size={14} className="text-primary-400 shrink-0" />
                                  <span>₹{booking.price} · Paid</span>
                                </div>
                              </div>
                              {/* Footer */}
                              <div className="px-5 pb-5 flex items-center gap-2 border-t border-gray-100 pt-4">
                                <button
                                  onClick={() => handleGetDirections(booking.location)}
                                  className="w-full btn-primary px-3 py-2 text-sm font-semibold"
                                >
                                  Get Directions
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-600 col-span-2">No upcoming bookings</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'invites' && (
                <>
                  <h3 className="font-bold text-gray-900 mb-4">Team Invites</h3>
                  {invitesLoading && (
                    <div className="flex justify-center py-12">
                      <svg className="animate-spin w-8 h-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                  )}
                  {!invitesLoading && (
                    <div className="space-y-4">
                      {invites.map(invite => (
                        <div key={invite.id} className="card p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                <Users className="text-primary-600" size={20} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{invite.teamName}</h4>
                                <p className="text-sm text-gray-600">From {invite.fromName || invite.fromEmail}</p>
                                <p className="text-xs text-gray-400">{invite.sport}</p>
                              </div>
                            </div>
                            {invite.offeredRole && <Pill>{invite.offeredRole}</Pill>}
                          </div>
                          {invite.message && (
                            <p className="text-sm text-gray-700 mb-4 italic">"{invite.message}"</p>
                          )}
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleAcceptInvite(invite.id)}
                              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition flex items-center gap-2"
                            >
                              <CheckCircle size={16} /> Accept
                            </button>
                            <button 
                              onClick={() => handleDeclineInvite(invite.id)}
                              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-2"
                            >
                              <X size={16} /> Decline
                            </button>
                          </div>
                        </div>
                      ))}
                      {invites.length === 0 && (
                        <div className="card p-12 text-center">
                          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No pending team invites</p>
                          <p className="text-sm text-gray-400 mt-1">When a team captain invites you, it will appear here.</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSave={handleSaveProfile}
      />
    </>
  );
};

export default ProfilePage;

