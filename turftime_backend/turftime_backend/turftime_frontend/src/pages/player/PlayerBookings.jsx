import { ArrowLeft, MapPin, Clock, Calendar, CreditCard, X, AlertCircle, CheckCircle, Share2, Users, Download, Star } from 'lucide-react';
import Toast from '../../components/Toast';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import venueService from '../../services/venueService';
import { jsPDF } from 'jspdf';

const PlayerBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [expandedCancel, setExpandedCancel] = useState(null);
  const [cancelledBooking, setCancelledBooking] = useState(null);
  const [cancelConfirmationId, setCancelConfirmationId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [venues, setVenues] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const downloadTicket = (booking) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a5' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // ── Background ──
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');

    // ── Header bar ──
    doc.setFillColor(14, 100, 50);
    doc.rect(0, 0, W, 80, 'F');

    // Accent stripe
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 80, W, 5, 'F');

    // Brand name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.text('TurfTime', W / 2, 42, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(187, 247, 208);
    doc.text('Sports Venue Booking Ticket', W / 2, 62, { align: 'center' });

    // ── Status badge ──
    const statusColor = booking.status?.toLowerCase() === 'cancelled' ? [254,226,226] : [240,253,244];
    const statusBorder = booking.status?.toLowerCase() === 'cancelled' ? [239,68,68] : [34,197,94];
    const statusText   = booking.status?.toLowerCase() === 'cancelled' ? [153,27,27]  : [22,101,52];
    doc.setFillColor(...statusColor);
    doc.setDrawColor(...statusBorder);
    doc.setLineWidth(1);
    doc.roundedRect(20, 96, W - 40, 32, 5, 5, 'FD');
    doc.setTextColor(...statusText);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`BOOKING ${(booking.status || 'CONFIRMED').toUpperCase()}`, W / 2, 117, { align: 'center' });

    // ── Booking ID ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('BOOKING ID', W / 2, 145, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('courier', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text(booking.id, W / 2, 159, { align: 'center' });

    // ── Divider ──
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(20, 172, W - 20, 172);

    // ── Detail rows ──
    const row = (label, value, y) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(label, 30, y);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(String(value || ''), 30, y + 15);
    };

    const fmtDate = (d) => {
      try { return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
      catch { return String(d); }
    };

    row('VENUE',        booking.venue,          185);
    row('LOCATION',     booking.location,       222);
    row('DATE',         fmtDate(booking.date),  259);
    row('TIME SLOT',    booking.time,           296);
    row('SPORT',        booking.sport,          333);
    row('PLAYER EMAIL', user?.email || '',      370);

    // ── Payment divider ──
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(20, 398, W - 20, 398);

    // Total paid (ASCII rupee)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('TOTAL PAID', 30, 416);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text(`Rs. ${booking.price}`, W - 30, 416, { align: 'right' });

    // ── Tear-line ──
    doc.setDrawColor(209, 213, 219);
    doc.setLineDashPattern([4, 4], 0);
    doc.setLineWidth(0.7);
    doc.line(20, 440, W - 20, 440);
    doc.setLineDashPattern([], 0);

    // ── Footer ──
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 440, W, 95, 'F');

    // Barcode-style decorative stripes
    const bx = W / 2 - 40;
    const barWidths = [2,1,3,1,2,1,1,2,3,1,2,1,3,2,1,2,1,3,1,2];
    let bxCur = bx;
    barWidths.forEach((bw, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(30, 30, 30);
        doc.rect(bxCur, 450, bw, 22, 'F');
      }
      bxCur += bw + 1;
    });

    doc.setFontSize(7);
    doc.setFont('courier', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(booking.id.substring(0, 16).toUpperCase(), W / 2, 486, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for booking with TurfTime!', W / 2, 503, { align: 'center' });
    doc.text('Please present this ticket at the venue entrance.', W / 2, 516, { align: 'center' });

    const shortRef = booking.id.substring(0, 10).toUpperCase();
    doc.save(`TurfTime_Ticket_${shortRef}.pdf`);
  };

  // Fetch bookings and venue details
  useEffect(() => {
    const fetchBookingsAndVenues = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch bookings
        const result = await bookingService.getBookingsByPlayer(user.email);

        if (result.success) {
          const bookingsData = result.data;

          // Fetch venue details for each unique venue
          const uniqueVenueIds = [...new Set(bookingsData.map(b => b.venueId))];
          const venuePromises = uniqueVenueIds.map(id => venueService.getVenueById(id));
          const venueResults = await Promise.all(venuePromises);

          // Create venue map
          const venueMap = {};
          venueResults.forEach((result, index) => {
            if (result.success) {
              venueMap[uniqueVenueIds[index]] = result.data;
            }
          });

          setVenues(venueMap);

          // Load locally cached venue details (saved at booking time)
          const venueCache = JSON.parse(localStorage.getItem('venueCache') || '{}');

          // Map bookings to the format expected by the UI
          const mappedBookings = bookingsData.map(booking => {
            const venue = venueMap[booking.venueId] || {};
            const cached = venueCache[booking.id] || {};
            const startTime = booking.startTime?.substring(0, 5) || '00:00'; // HH:MM
            const endTime = booking.endTime?.substring(0, 5) || '00:00';

            // Priority: booking fields (if backend stores them) → local cache → separate venue service data
            const venueName = booking.venueName || cached.venueName || venue.name || 'Unknown Venue';
            const venueLocation = booking.venueLocation || cached.venueLocation || venue.location || venue.city || 'Unknown Location';
            const venueSport = booking.sport || cached.sport || venue.sport || 'Unknown';
            const venuePrice = booking.amount || cached.price || venue.pricePerHour || venue.price || venue.pricing || 0;

            return {
              id: booking.id,
              venue: venueName,
              date: booking.bookingDate,
              time: `${startTime} - ${endTime}`,
              location: venueLocation,
              status: booking.status.toLowerCase(),
              price: venuePrice,
              sport: venueSport,
              venueId: booking.venueId || cached.venueId,
            };
          }).filter(b => b.venue !== 'Unknown Venue' && b.venue !== 'Unknown');

          setBookings(mappedBookings);
        } else {
          setError(result.message || 'Failed to fetch bookings');
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('An error occurred while loading your bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingsAndVenues();
  }, [user]);

  const today = new Date('2026-01-09');

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilteredBookings = () => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      
      if (activeTab === 'all') return true;
      
      if (activeTab === 'upcoming') {
        return bookingDate >= today && (booking.status === 'confirmed' || booking.status === 'pending');
      }
      
      if (activeTab === 'completed') {
        return booking.status === 'completed' || bookingDate < today;
      }
      
      if (activeTab === 'cancelled') {
        return booking.status === 'cancelled';
      }
      
      return true;
    });
  };

  const filteredBookings = getFilteredBookings();
  const upcomingCount = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    return bookingDate >= today && (booking.status === 'confirmed' || booking.status === 'pending');
  }).length;
  const completedCount = bookings.filter(booking => booking.status === 'completed').length;
  const cancelledCount = bookings.filter(booking => booking.status === 'cancelled').length;
  const allBookingsCount = bookings.length;
  const totalSpend = bookings
    .filter(booking => booking.status !== 'cancelled')
    .reduce((sum, booking) => sum + booking.price, 0);

  const toggleDetails = (bookingId) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  const toggleCancel = (bookingId) => {
    setExpandedCancel(expandedCancel === bookingId ? null : bookingId);
  };

  const handleGetDirections = (location) => {
    const encodedLocation = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
  };

  const handleCancelConfirm = async (bookingId) => {
    try {
      const result = await bookingService.cancelBooking(bookingId);

      if (result.success) {
        // Update the booking in the state
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking.id === bookingId
              ? { ...booking, status: 'cancelled' }
              : booking
          )
        );

        setCancelledBooking(bookingId);
        const code = 'CNL-' + bookingId.substring(0, 5).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        setCancelConfirmationId(code);
        setExpandedCancel(null);
      } else {
        showToast(result.message || 'Failed to cancel booking', 'error');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      showToast('An error occurred while cancelling the booking', 'error');
    }
  };

  const currentCancelBooking = bookings.find(b => b.id === expandedCancel);
  const currentCancelledBooking = bookings.find(b => b.id === cancelledBooking);

  return (
    <>
    <Toast toast={toast} onClose={() => setToast(null)} />
    <div className="page-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            to="/player/dashboard" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 font-medium"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">Manage and view all your venue bookings</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">All Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{allBookingsCount}</p>
            </div>
            <CheckCircle className="text-primary-600" size={24} />
          </div>
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingCount}</p>
            </div>
            <Clock className="text-primary-600" size={24} />
          </div>
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{cancelledCount}</p>
            </div>
            <X className="text-red-500" size={24} />
          </div>
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalSpend}</p>
            </div>
            <CreditCard className="text-primary-600" size={24} />
          </div>
        </div>
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'all' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Bookings
          </button>
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'upcoming' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'cancelled' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cancelled
          </button>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 mt-4">Loading bookings...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg inline-block">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map(booking => (
            <div 
              key={booking.id} 
              className="card bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{booking.venue}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{booking.sport}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">₹{booking.price}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar size={18} className="mr-2 text-gray-400" />
                    <span className="text-sm">{new Date(booking.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock size={18} className="mr-2 text-gray-400" />
                    <span className="text-sm">{booking.time}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin size={18} className="mr-2 text-gray-400" />
                    <span className="text-sm">{booking.location}</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {booking.status === 'completed' ? (
                    <>
                      <button 
                        onClick={() => navigate(`/venues/${booking.venueId}`)}
                        className="flex-1 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 font-medium transition"
                      >
                        Book Again
                      </button>
                      <button 
                        onClick={() => toggleDetails(booking.id)}
                        className="flex-1 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 font-medium transition"
                      >
                        View Details 
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleGetDirections(booking.location)}
                        className="flex-1 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 font-medium transition"
                      >
                        Get Directions
                      </button>
                      <button 
                        onClick={() => toggleDetails(booking.id)}
                        className="flex-1 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 font-medium transition"
                      >
                        View Details
                      </button>
                      {booking.status === 'confirmed' && (
                        <button 
                          onClick={() => toggleCancel(booking.id)}
                          className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition flex items-center justify-center"
                        >
                          <X size={18} className="mr-1" />
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                </div>
                {expandedBooking === booking.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    {/* Booking ID - prominently shown */}
                    <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-1">Booking ID</p>
                          <p className="text-sm font-bold text-primary-900 break-all">{booking.id}</p>
                          <p className="text-xs text-primary-600 mt-1">Use this ID to submit a review</p>
                        </div>
                        <button
                          onClick={() => downloadTicket(booking)}
                          className="shrink-0 flex items-center gap-1 px-3 py-2 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition whitespace-nowrap"
                        >
                          <Download size={13} /> Download Ticket
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Venue</span>
                        <span className="text-sm font-medium text-gray-900">{booking.venue}</span>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sport</span>
                        <span className="text-sm font-medium text-gray-900">{booking.sport}</span>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</span>
                        <span className="text-sm font-medium text-gray-900">{booking.location}</span>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</span>
                        <span className="text-sm font-medium text-gray-900">{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</span>
                        <span className="text-sm font-medium text-gray-900">{booking.time}</span>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</span>
                        <span className="text-sm font-bold text-green-700">₹{booking.price}</span>
                      </div>
                    </div>
                    {(booking.status === 'confirmed' || booking.status === 'completed') && (
                      <button
                        onClick={() => navigate(`/venues/${booking.venueId}?review=true&bookingId=${booking.id}`)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-100 font-medium transition"
                      >
                        <Star size={16} className="fill-yellow-400 text-yellow-400" />
                        Write a Review for this Venue
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No bookings found in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
    {expandedCancel && currentCancelBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
              Cancel Booking?
            </h2>
            <p className="text-center text-gray-600 text-sm mb-3">
              Are you sure you want to cancel your booking at
            </p>
            <div className="text-center mb-5">
              <p className="text-gray-900 font-bold text-base">{currentCancelBooking.venue.split(' ').slice(0, 1).join(' ')}</p>
              <p className="text-gray-900 font-bold text-base">{currentCancelBooking.venue.split(' ').slice(1).join(' ')}</p>
            </div>
            <p className="text-center text-red-600 text-xs font-semibold mb-6">
              This action cannot be undone.
            </p>
            <div className="bg-green-50 rounded-lg p-5 mb-8 border border-green-200">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Refund Amount</p>
                <p className="text-lg font-bold text-gray-900">₹{currentCancelBooking.price}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-xs text-gray-700">
                  Amount will be refunded to original source within 5-7 days.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setExpandedCancel(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-800 rounded-full font-semibold hover:bg-gray-200 transition duration-200 border border-gray-300"
              >
                No, Keep it
              </button>
              <button 
                onClick={() => handleCancelConfirm(currentCancelBooking.id)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition duration-200"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    {cancelledBooking && currentCancelledBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
              Booking Cancelled
            </h2>
            <p className="text-center text-gray-600 text-sm mb-6">
              Your booking has been successfully cancelled.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3 border border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Venue:</span>
                <span className="text-gray-900 font-semibold text-sm">{currentCancelledBooking.venue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Refund Amount:</span>
                <span className="text-green-600 font-semibold text-sm">₹{currentCancelledBooking.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Confirmation ID:</span>
                <span className="text-gray-900 font-semibold text-sm">{cancelConfirmationId}</span>
              </div>
            </div>
            <button 
              onClick={() => { setCancelledBooking(null); setCancelConfirmationId(null); }}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition duration-200"
            >
              Back to Bookings
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerBookings;

