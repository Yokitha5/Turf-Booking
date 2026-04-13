import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import notificationService from '../services/notificationService';
import { API_CONFIG } from '../config/apiConfig';
import { jsPDF } from 'jspdf';

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { venue, date, slot } = location.state || {};
  

  const [bookingDetails, setBookingDetails] = useState({
    playerName: '',
    playerCount: 1,
    phone: '',
    specialRequests: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState(null);
  const [error, setError] = useState(null);

  if (!venue || !date || !slot) {
    navigate('/venues');
    return null;
  }

  const subtotal = slot.price;
  const tax = subtotal * 0.18; 
  const total = subtotal + tax;

  const handleInputChange = (e) => {
    setBookingDetails({
      ...bookingDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // Generate a temporary booking ID
      const tempBookingId = `TEMP_${Date.now()}`;

      // Step 1: Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent({
        bookingId: tempBookingId,
        amount: total,
      });

      if (!paymentIntent.success) {
        setError(paymentIntent.message || 'Failed to create payment intent');
        setIsProcessing(false);
        return;
      }

      const { razorpayOrderId, amount } = paymentIntent.data;

      // Step 2: Open Razorpay Checkout
      const options = {
        key: API_CONFIG.RAZORPAY_KEY,
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        name: 'TurfTime',
        description: `Booking at ${venue.name}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          // Step 3: Verify payment
          const verificationResult = await paymentService.verifyPayment({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });

          if (verificationResult.success) {
            // Step 4: Create booking after successful payment
            const [startTimeStr, endTimeStr] = slot.time.split(' - ');
            const startTime = `${startTimeStr}:00`;
            const endTime = `${endTimeStr}:00`;
            // Use date string directly — toISOString() shifts to UTC which gives
            // yesterday's date for UTC+ timezones (e.g. IST UTC+5:30)
            const bookingDate = typeof date === 'string'
              ? date
              : `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

            // Validate email before sending
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!user.email || !emailRegex.test(user.email)) {
              setError('Session error: Invalid email detected. Please logout and login again.');
              setIsProcessing(false);
              return;
            }

            const bookingRequest = {
              venueId: venue.id.toString(),
              playerEmail: user.email,
              bookingDate: bookingDate,
              startTime: startTime,
              endTime: endTime,
              venueName: venue.name,
              venueLocation: venue.location || venue.city || '',
              sport: venue.sport || '',
              amount: total,
            };

            const bookingResult = await bookingService.createBooking(bookingRequest);

            if (bookingResult.success) {
              const bookingId = bookingResult.data?.id
                ? bookingResult.data.id.substring(0, 10).toUpperCase()
                : `TT${Date.now().toString().slice(-8)}`;
              setBookingRef(bookingId);
              setBookingSuccess(true);
              setIsProcessing(false);

              // Cache venue details locally so PlayerBookings can show them even if venue service fails
              if (bookingResult.data?.id) {
                try {
                  const venueCache = JSON.parse(localStorage.getItem('venueCache') || '{}');
                  venueCache[bookingResult.data.id] = {
                    venueName: venue.name,
                    venueLocation: venue.location || venue.city || '',
                    sport: venue.sport || '',
                    price: total,
                    venueId: venue.id?.toString(),
                  };
                  localStorage.setItem('venueCache', JSON.stringify(venueCache));
                } catch (_) {}
              }

              // Send booking notification email
              try {
                await notificationService.sendBookingNotification({
                  id: bookingResult.data?.id || bookingId,
                  venueId: venue.name,
                  playerEmail: user.email,
                  bookingDate: bookingDate,
                  startTime: startTime,
                  endTime: endTime,
                  status: 'CONFIRMED',
                });
              } catch (notifErr) {
                console.warn('Notification failed:', notifErr);
              }

              setTimeout(() => {
                navigate('/player/bookings');
              }, 5000);
            } else {
              console.error('Booking creation failed:', bookingResult);
              setError(
                bookingResult.message
                  ? `Booking failed: ${bookingResult.message}`
                  : 'Payment successful but booking failed. Please contact support.'
              );
              setIsProcessing(false);
            }
          } else {
            setError('Payment verification failed. Please contact support.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: bookingDetails.playerName || user.name,
          email: user.email,
          contact: bookingDetails.phone,
        },
        notes: {
          venue: venue.name,
          date: date,
          time: slot.time,
        },
        theme: {
          color: '#10b981', // Primary green color
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setError('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred while processing payment.');
      setIsProcessing(false);
    }
  };

  if (bookingSuccess) {
    const downloadTicket = () => {
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
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(1);
      doc.roundedRect(20, 96, W - 40, 32, 5, 5, 'FD');
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('BOOKING CONFIRMED', W / 2, 117, { align: 'center' });

      // ── Booking ID ──
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('BOOKING ID', W / 2, 145, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('courier', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text(bookingRef, W / 2, 159, { align: 'center' });

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
        doc.text(String(value), 30, y + 15);
      };

      const fmtDate = (d) => {
        try { return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
        catch { return String(d); }
      };

      row('VENUE',        venue.name,                          185);
      row('LOCATION',     venue.location || venue.city || '',  222);
      row('DATE',         fmtDate(date),                       259);
      row('TIME SLOT',    slot.time,                           296);
      row('PLAYER EMAIL', user.email,                         333);

      // ── Payment divider ──
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(20, 362, W - 20, 362);

      // Payment rows (ASCII rupee: Rs.)
      const payRow = (label, value, y, bold = false) => {
        doc.setFontSize(bold ? 11 : 9);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(bold ? 17 : 107, bold ? 24 : 114, bold ? 39 : 128);
        doc.text(label, 30, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(bold ? 22 : 17, bold ? 101 : 24, bold ? 52 : 39);
        doc.text(value, W - 30, y, { align: 'right' });
      };

      payRow('Slot Price',  `Rs. ${subtotal}`,          378);
      payRow('GST (18%)',   `Rs. ${tax.toFixed(2)}`,    394);

      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.5);
      doc.line(20, 406, W - 20, 406);

      payRow('TOTAL PAID', `Rs. ${total.toFixed(2)}`,   421, true);

      // ── Tear-line ──
      doc.setDrawColor(209, 213, 219);
      doc.setLineDashPattern([4, 4], 0);
      doc.setLineWidth(0.7);
      doc.line(20, 445, W - 20, 445);
      doc.setLineDashPattern([], 0);

      // ── Footer ──
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 445, W, 90, 'F');

      // Barcode-style decorative stripes
      const bx = W / 2 - 40;
      const barWidths = [2,1,3,1,2,1,1,2,3,1,2,1,3,2,1,2,1,3,1,2];
      let bxCur = bx;
      barWidths.forEach((bw, i) => {
        if (i % 2 === 0) {
          doc.setFillColor(30, 30, 30);
          doc.rect(bxCur, 455, bw, 22, 'F');
        }
        bxCur += bw + 1;
      });

      doc.setFontSize(7);
      doc.setFont('courier', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(bookingRef.substring(0, 16).toUpperCase(), W / 2, 491, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Thank you for booking with TurfTime!', W / 2, 508, { align: 'center' });
      doc.text('Please present this ticket at the venue entrance.', W / 2, 521, { align: 'center' });

      doc.save(`TurfTime_Ticket_${bookingRef}.pdf`);
    };

    return (
      <div className="page-bg min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Success Banner */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-14 h-14 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-500 text-lg">Your venue has been successfully booked</p>
          </div>

          {/* Booking Reference Card */}
          <div className="card p-6 mb-6 border-2 border-green-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Booking Reference</p>
                <p className="text-3xl font-bold text-primary-600 mt-1">{bookingRef}</p>
              </div>
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-white" />
              </div>
            </div>
          </div>

          {/* Booking Details Card */}
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Details</h2>
            <div className="flex gap-4 mb-4">
              <img
                src={venue.images[0]}
                alt={venue.name}
                className="w-24 h-24 rounded-lg object-cover shrink-0"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
                <div className="flex items-center text-gray-500 text-sm mt-1">
                  <MapPin size={14} className="mr-1" />
                  {venue.location}
                </div>
              </div>
            </div>
            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Calendar size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Clock size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time Slot</p>
                  <p className="font-semibold text-gray-900 text-sm">{slot.time}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Slot Price</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (18%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total Paid</span>
                <span className="text-green-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle size={18} className="text-green-600 shrink-0" />
              <p className="text-sm text-green-700">Payment Successful · Confirmation sent to <span className="font-medium">{user.email}</span></p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <button
              onClick={() => navigate('/venues')}
              className="btn-secondary py-3 text-center"
            >
              Book Another Venue
            </button>
            <button
              onClick={() => navigate('/player/bookings')}
              className="btn-primary py-3"
            >
              View My Bookings
            </button>
          </div>
          <button
            onClick={downloadTicket}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border-2 border-green-600 text-green-700 font-semibold hover:bg-green-50 transition-colors"
          >
            <Download size={18} />
            Download Ticket (PDF)
          </button>

          <p className="text-center text-sm text-gray-400 mt-4">
            Redirecting to My Bookings in 5 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Booking</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleBooking} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person Name
                    </label>
                    <input
                      type="text"
                      name="playerName"
                      required
                      value={bookingDetails.playerName}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Players
                    </label>
                    <input
                      type="number"
                      name="playerCount"
                      required
                      min="1"
                      max="50"
                      value={bookingDetails.playerCount}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={bookingDetails.phone}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      name="specialRequests"
                      value={bookingDetails.specialRequests}
                      onChange={handleInputChange}
                      rows="3"
                      className="input-field"
                      placeholder="Any special requirements or requests..."
                    />
                  </div>
                </div>
              </div>


              <button
                type="submit"
                disabled={isProcessing}
                className="w-full btn-primary py-4 text-lg disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
              </button>
            </form>
          </div>
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <img
                    src={venue.images[0]}
                    alt={venue.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <MapPin size={14} className="mr-1" />
                    {venue.location}
                  </p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center text-gray-700">
                    <Calendar size={18} className="mr-2 text-primary-600" />
                    <span className="text-sm">{new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Clock size={18} className="mr-2 text-primary-600" />
                    <span className="text-sm">{slot.time}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 mb-4">
                <div className="flex justify-between text-gray-700">
                  <span>Slot Price</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>GST (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-primary-600">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;

