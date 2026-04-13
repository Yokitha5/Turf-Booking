import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Toast from '../components/Toast';
import { MapPin, Star, Phone, Mail, Clock, DollarSign, Wifi, Car, Utensils, Calendar, Users, CheckCircle, Lock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import venueService from '../services/venueService';
import reviewService from '../services/reviewService';
import bookingService from '../services/bookingService';

const FALLBACK_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="50" height="50" rx="8" fill="%2316a34a"/><text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="20" fill="white">T</text></svg>';

const VenueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [venueData, setVenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    bookingId: '',
    venueId: '',
    ownerEmail: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const [bookedTimes, setBookedTimes] = useState([]);
  const [closedTimes, setClosedTimes] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxCount, setLightboxCount] = useState(0);

  const openLightbox = (index, total) => { setLightboxIndex(index); setLightboxCount(total); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const lightboxNext = () => setLightboxIndex(i => (i + 1) % lightboxCount);
  const lightboxPrev = () => setLightboxIndex(i => (i - 1 + lightboxCount) % lightboxCount);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % lightboxCount);
      else if (e.key === 'ArrowLeft') setLightboxIndex(i => (i - 1 + lightboxCount) % lightboxCount);
      else if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, lightboxCount]);

  // Fetch booked + owner-closed slots whenever date or venue changes
  useEffect(() => {
    if (!selectedDate || !id) return;
    setSelectedSlot(null);
    setLoadingSlots(true);

    // Load owner-closed slots from localStorage
    const closedKey = `closed_slots_${id}_${selectedDate}`;
    const stored = localStorage.getItem(closedKey);
    setClosedTimes(stored ? JSON.parse(stored) : []);

    // Fetch confirmed bookings for this venue+date
    bookingService.getBookingsByVenue(id, selectedDate)
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          const times = res.data
            .map(b => b.startTime?.substring(0, 5))
            .filter(Boolean);
          setBookedTimes(times);
        } else {
          setBookedTimes([]);
        }
      })
      .catch(() => setBookedTimes([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, id]);

  // Auto-open review form if navigated from My Bookings with ?review=true&bookingId=xxx
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reviewParam = params.get('review');
    const bookingIdParam = params.get('bookingId');
    if (reviewParam === 'true' && bookingIdParam) {
      setShowReviewForm(true);
      setReviewForm(prev => ({ ...prev, bookingId: bookingIdParam }));
      // Scroll to review section after page loads
      setTimeout(() => {
        document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 800);
    }
  }, [location.search]);

  // Fetch venue data from backend
  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        setLoading(true);
        const result = await venueService.getVenueById(id);
        
        if (result.success) {
          setVenueData(result.data);
          
          // Fetch reviews for this venue
          const reviewsResult = await reviewService.getReviewsByVenue(id);
          if (reviewsResult.success) {
            setReviews(reviewsResult.data || []);
          }
          
          setError(null);
        } else {
          setError(result.message || 'Failed to load venue details');
        }
      } catch (err) {
        console.error('Error fetching venue:', err);
        setError('Failed to load venue details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchVenueData();
  }, [id, navigate]);

  // Helper function to get amenity icons
  const getAmenityIcon = (amenity) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('parking') || amenityLower.includes('car'))
      return <Car size={20} />;
    if (amenityLower.includes('wifi'))
      return <Wifi size={20} />;
    if (amenityLower.includes('cafeteria') || amenityLower.includes('food'))
      return <Utensils size={20} />;
    return <Users size={20} />;
  };

  // Fallback data for development
  const fallbackVenuesData = {
    1: {
      id: 1,
      name: 'Playgrounds Cricket Arena',
      sport: 'Cricket',
      location: 'Ramanathapuram, Coimbatore, Tamil Nadu 641009',
      rating: 4.8,
      reviews: 124,
      price: 2000,
      peakPrice: 3000,
      images: [
        'https://images.pexels.com/photos/30671910/pexels-photo-30671910.jpeg',
        'https://images.pexels.com/photos/32801372/pexels-photo-32801372.jpeg',
        'https://images.pexels.com/photos/13509963/pexels-photo-13509963.jpeg'
      ],
      description: 'Premium cricket ground with well-maintained turf and professional facilities. Perfect for corporate matches, tournament practices, and friendly games. Our ground meets international standards and provides a great playing experience.',
      owner: 'Arun Kumar',
      contact: { phone: '+91 98765 43210', email: 'playgrounds@turftime.com' }
    },
    2: {
      id: 2,
      name: 'Premier Football Academy',
      sport: 'Football',
      location: 'RS Puram, Coimbatore, Tamil Nadu 641002',
      rating: 4.9,
      reviews: 98,
      price: 1500,
      peakPrice: 2500,
      images: [
        'https://images.pexels.com/photos/47354/the-ball-stadion-football-the-pitch-47354.jpeg',
        'https://images.pexels.com/photos/35205001/pexels-photo-35205001.jpeg',
        'https://images.pexels.com/photos/32179176/pexels-photo-32179176.jpeg'
      ],
      description: 'Professional football arena with FIFA-standard turf and state-of-the-art facilities. Ideal for competitive matches, training sessions, and recreational games. Features excellent drainage and floodlights for evening games.',
      owner: 'Surendra Raj',
      contact: { phone: '+91 98765 43211', email: 'premier@turftime.com' }
    },
    3: {
      id: 3,
      name: 'Swift Badminton Courts',
      sport: 'Badminton',
      location: 'Gandhipuram, Coimbatore, Tamil Nadu 641012',
      rating: 4.7,
      reviews: 156,
      price: 500,
      peakPrice: 800,
      images: [
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80',
        'https://images.pexels.com/photos/8007173/pexels-photo-8007173.jpeg',
        'https://images.pexels.com/photos/26238668/pexels-photo-26238668.jpeg'
      ],
      description: 'Premium air-conditioned badminton courts with international-standard wooden flooring. Perfect for both casual games and professional training. Features excellent lighting and ventilation for optimal playing conditions.',
      owner: 'Giri Kumar',
      contact: { phone: '+91 98765 43212', email: 'swift@turftime.com' }
    },
    4: {
      id: 4,
      name: 'Elite Tennis Court',
      sport: 'Tennis',
      location: 'Peelamedu, Coimbatore, Tamil Nadu 641004',
      rating: 4.6,
      reviews: 87,
      price: 800,
      peakPrice: 1200,
      images: [
        'https://images.pexels.com/photos/8223922/pexels-photo-8223922.jpeg',
        'https://images.pexels.com/photos/12806375/pexels-photo-12806375.jpeg',
        'https://images.pexels.com/photos/8224759/pexels-photo-8224759.jpeg'
      ],
      description: 'Professional tennis academy with hard courts and synthetic grass courts. Offers coaching by certified professionals. Suitable for all skill levels from beginners to advanced players.',
      owner: 'Naveen Prakash',
      contact: { phone: '+91 98765 43213', email: 'elitetennis@turftime.com' }
    },
    5: {
      id: 5,
      name: 'Victory Sports Ground',
      sport: 'Cricket',
      location: 'Saibaba Colony, Coimbatore, Tamil Nadu 641011',
      rating: 4.9,
      reviews: 203,
      price: 2500,
      peakPrice: 3500,
      images: [
        'https://images.pexels.com/photos/33851213/pexels-photo-33851213.jpeg',
        'https://images.pexels.com/photos/3628912/pexels-photo-3628912.jpeg',
        'https://images.pexels.com/photos/30671903/pexels-photo-30671903.jpeg'
      ],
      description: 'Premium cricket complex with multiple grounds and comprehensive facilities. Features include gym, cafeteria, and dedicated practice nets. Perfect venue for tournaments and corporate events.',
      owner: 'Vikram Reddy',
      contact: { phone: '+91 98765 43214', email: 'victory@turftime.com' }
    },
    6: {
      id: 6,
      name: 'Kuvera Sports Complex',
      sport: 'Football',
      location: 'Matenahalli, Coimbatore, Tamil Nadu 641035',
      rating: 4.5,
      reviews: 76,
      price: 1800,
      peakPrice: 2800,
      images: [
        'https://images.pexels.com/photos/35180876/pexels-photo-35180876.jpeg',
        'https://images.pexels.com/photos/28355100/pexels-photo-28355100.jpeg',
        'https://images.pexels.com/photos/35180913/pexels-photo-35180913.jpeg'
      ],
      description: 'Well-maintained football ground with quality turf and excellent facilities. Perfect for weekend matches and practice sessions. Features powerful floodlights for night games.',
      owner: 'Karthik Menon',
      contact: { phone: '+91 98765 43215', email: 'kuvera@turftime.com' }
    },
    7: {
      id: 7,
      name: 'Aqua Elite Swimming Pool',
      sport: 'Swimming',
      location: 'Race Course, Coimbatore, Tamil Nadu 641018',
      rating: 4.8,
      reviews: 142,
      price: 300,
      peakPrice: 500,
      images: [
        'https://images.pexels.com/photos/1263425/pexels-photo-1263425.jpeg',
        'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&auto=format&fit=crop&q=80'
      ],
      description: 'Olympic-sized swimming pool with temperature control and advanced filtration system. Ideal for lap swimming, training, and recreational activities. Professional lifeguards on duty at all times.',
      owner: 'Deepa Krishnan',
      contact: { phone: '+91 98765 43216', email: 'aquaelite@turftime.com' }
    },
    8: {
      id: 8,
      name: 'SwimZone Olympic Pool',
      sport: 'Swimming',
      location: 'Ukkadam, Coimbatore, Tamil Nadu 641001',
      rating: 4.9,
      reviews: 178,
      price: 350,
      peakPrice: 600,
      images: [
        'https://images.pexels.com/photos/8688171/pexels-photo-8688171.jpeg',
        'https://images.pexels.com/photos/4045131/pexels-photo-4045131.jpeg',
        'https://images.pexels.com/photos/2062701/pexels-photo-2062701.jpeg'
      ],
      description: 'State-of-the-art swimming facility with separate training and leisure pools. Features include changing rooms, lockers, and coaching services. Perfect for competitive swimmers and families alike.',
      owner: 'Rajesh Kumar',
      contact: { phone: '+91 98765 43217', email: 'swimzone@turftime.com' }
    },
    9: {
      id: 9,
      name: 'Splash Water Sports Center',
      sport: 'Swimming',
      location: 'Brookefields, Coimbatore, Tamil Nadu 641020',
      rating: 4.7,
      reviews: 91,
      price: 400,
      peakPrice: 700,
      images: [
        'https://images.pexels.com/photos/8688158/pexels-photo-8688158.jpeg',
        'https://images.pexels.com/photos/19073612/pexels-photo-19073612.jpeg',
        'https://images.pexels.com/photos/31522680/pexels-photo-31522680.jpeg'
      ],
      description: 'Modern aquatic center with multiple pools including kids pool, lap pool, and diving pool. Additional amenities include sauna, steam room, and wellness center. Professional coaching available.',
      owner: 'Anitha Ramesh',
      contact: { phone: '+91 98765 43218', email: 'splash@turftime.com' }
    },
    10: {
      id: 10,
      name: 'Hoop Dreams Basketball Court',
      sport: 'Basketball',
      location: 'Saibaba Colony, Coimbatore, Tamil Nadu 641011',
      rating: 4.8,
      reviews: 134,
      price: 800,
      peakPrice: 1200,
      images: [
        'https://images.pexels.com/photos/2304345/pexels-photo-2304345.jpeg',
        'https://images.pexels.com/photos/974502/pexels-photo-974502.jpeg',
        'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&auto=format&fit=crop&q=80'
      ],
      description: 'Professional indoor basketball court with maple wood flooring and NBA-standard hoops. Features excellent ventilation, scoreboard, and seating area. Perfect for competitive games and training sessions.',
      owner: 'Suresh Kumar',
      contact: { phone: '+91 98765 43219', email: 'hoopdreams@turftime.com' }
    },
    11: {
      id: 11,
      name: 'Pro Pickleball Arena',
      sport: 'Pickleball',
      location: 'Gandhipuram, Coimbatore, Tamil Nadu 641012',
      rating: 4.6,
      reviews: 78,
      price: 400,
      peakPrice: 650,
      images: [
        'https://images.pexels.com/photos/35688558/pexels-photo-35688558.jpeg',
        'https://images.pexels.com/photos/34618471/pexels-photo-34618471.jpeg',
        'https://images.pexels.com/photos/17299526/pexels-photo-17299526.jpeg'
      ],
      description: 'Dedicated pickleball facility with multiple courts featuring cushioned surfaces. Air-conditioned indoor courts with proper lighting. Equipment rental available. Suitable for all skill levels.',
      owner: 'Priya Sharma',
      contact: { phone: '+91 98765 43220', email: 'propickleball@turftime.com' }
    },
    12: {
      id: 12,
      name: 'TT Championship Hall',
      sport: 'Table Tennis',
      location: 'Peelamedu, Coimbatore, Tamil Nadu 641004',
      rating: 4.7,
      reviews: 102,
      price: 350,
      peakPrice: 550,
      images: [
        'https://images.pexels.com/photos/709134/pexels-photo-709134.jpeg',
        'https://images.pexels.com/photos/17619318/pexels-photo-17619318.jpeg',
        'https://images.pexels.com/photos/13793163/pexels-photo-13793163.jpeg'
      ],
      description: 'Professional table tennis center with tournament-grade tables and flooring. Air-conditioned environment with excellent lighting. Coaching available from certified trainers. Hosts regular competitions.',
      owner: 'Venkat Subramanian',
      contact: { phone: '+91 98765 43221', email: 'ttchampionship@turftime.com' }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading venue details...</p>
        </div>
      </div>
    );
  }

  // Use backend data or fallback
  const currentVenueData = venueData || fallbackVenuesData[parseInt(id)];
  
  if (!currentVenueData) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Venue not found</h2>
          <p className="text-gray-600 mb-4">
            {error || "The venue you're looking for doesn't exist."}
          </p>
          <button onClick={() => navigate('/venues')} className="btn-primary">
            Back to Venues
          </button>
        </div>
      </div>
    );
  }

  // Map backend data to frontend structure
  const venue = {
    id: currentVenueData.id,
    name: currentVenueData.name,
    sport: currentVenueData.sport || 'General',
    location: currentVenueData.location,
    rating: currentVenueData.averageRating || currentVenueData.rating || 4.5,
    reviews: currentVenueData.totalReviews || currentVenueData.reviews || 0,
    price: currentVenueData.pricePerHour || currentVenueData.price,
    peakPrice: currentVenueData.peakPricePerHour || currentVenueData.peakPrice || (currentVenueData.pricePerHour || currentVenueData.price) * 1.5,
    images: currentVenueData.mediaUrls && currentVenueData.mediaUrls.length > 0
      ? currentVenueData.mediaUrls
      : currentVenueData.images || [
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="%2316a34a"/><text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="white">Sports Venue</text></svg>',
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="%2316a34a"/><text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="16" fill="white">Venue</text></svg>',
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="%2316a34a"/><text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="16" fill="white">Venue</text></svg>'
        ],
    description: currentVenueData.description || 'Premium sports venue with excellent facilities.',
    owner: currentVenueData.ownerName || currentVenueData.owner || 'Venue Owner',
    contact: currentVenueData.contact || {
      phone: currentVenueData.contactPhone || '+91 98765 43210',
      email: currentVenueData.ownerEmail || 'venue@turftime.com'
    },
    amenities: currentVenueData.amenities 
      ? (Array.isArray(currentVenueData.amenities) && currentVenueData.amenities.length > 0 && typeof currentVenueData.amenities[0] === 'string'
          ? currentVenueData.amenities.map(amenity => ({
              name: amenity,
              icon: getAmenityIcon(amenity)
            }))
          : currentVenueData.amenities)
      : [
      { name: 'Parking', icon: <Car size={20} /> },
      { name: 'WiFi', icon: <Wifi size={20} /> },
      { name: 'Cafeteria', icon: <Utensils size={20} /> },
      { name: 'Changing Rooms', icon: <Users size={20} /> }
    ],
    rules: currentVenueData.rules || [
      'Arrive 15 minutes before your slot',
      'Proper sports attire required',
      'No outside food or drinks',
      'Smoking and alcohol prohibited',
      'Respect the equipment and facilities'
    ],
    openingHours: currentVenueData.openingTime && currentVenueData.closingTime 
      ? `${currentVenueData.openingTime} - ${currentVenueData.closingTime}`
      : currentVenueData.openingHours || '6:00 AM - 11:00 PM',
    slots: currentVenueData.slots || generateTimeSlots(currentVenueData)
  };

  // Generate time slots based on opening/closing times
  function generateTimeSlots(venueInfo) {
    const slots = [];
    const price = venueInfo.pricePerHour || venueInfo.price || 1000;
    const peakPrice = venueInfo.peakPricePerHour || venueInfo.peakPrice || price * 1.5;
    
    // Sample slots (in production, this should be based on actual slot duration and booking data)
    const timeSlots = [
      { time: '06:00 - 07:00', available: true, type: 'non-peak', price: price },
      { time: '07:00 - 08:00', available: true, type: 'non-peak', price: price },
      { time: '08:00 - 09:00', available: false, type: 'peak', price: peakPrice },
      { time: '09:00 - 10:00', available: true, type: 'peak', price: peakPrice },
      { time: '10:00 - 11:00', available: true, type: 'peak', price: peakPrice },
      { time: '11:00 - 12:00', available: true, type: 'non-peak', price: price },
      { time: '12:00 - 13:00', available: true, type: 'non-peak', price: price },
      { time: '16:00 - 17:00', available: true, type: 'peak', price: peakPrice },
      { time: '17:00 - 18:00', available: true, type: 'peak', price: peakPrice },
      { time: '18:00 - 19:00', available: false, type: 'peak', price: peakPrice },
      { time: '19:00 - 20:00', available: true, type: 'peak', price: peakPrice },
      { time: '20:00 - 21:00', available: true, type: 'non-peak', price: price }
    ];
    
    return timeSlots;
  }

  const handleReviewInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please login to submit a review', 'warning');
      return;
    }
    if (!reviewForm.bookingId) {
      showToast('Please enter your booking ID', 'warning');
      return;
    }
    setSubmittingReview(true);
    try {
      const reviewData = {
        bookingId: reviewForm.bookingId,
        venueId: id,
        ownerEmail: venue.contact?.email || 'owner@turftime.com',
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      };
      const token = sessionStorage.getItem('token');
      const result = await reviewService.addReview(reviewData, token);
      if (result.success) {
        setReviewForm({ rating: 5, comment: '', bookingId: '', venueId: '', ownerEmail: '' });
        setShowReviewForm(false);
        navigate(`/venues/${id}`);
      } else {
        showToast(result.message || 'Failed to submit review', 'error');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('Error submitting review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBooking = () => {
    if (!selectedDate || !selectedSlot) {
      return;
    }
    const venueData = {
      id: venue.id,
      name: venue.name,
      sport: venue.sport,
      location: venue.location,
      rating: venue.rating,
      reviews: venue.reviews,
      price: venue.price,
      peakPrice: venue.peakPrice,
      images: venue.images,
      amenities: venue.amenities.map(a => ({ name: a.name })),
      description: venue.description,
      rules: venue.rules,
      openingHours: venue.openingHours,
      contact: venue.contact,
      owner: venue.owner,
      slots: venue.slots
    };
    
    navigate('/booking', {
      state: {
        venue: venueData,
        date: selectedDate,
        slot: selectedSlot
      }
    });
  };

  return (
    <div className="page-bg">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-2 p-2">
            <div className="md:col-span-2">
              <img
                src={venue.images[0]}
                alt={venue.name}
                className="w-full h-100 object-cover rounded-lg cursor-pointer hover:brightness-90 transition-all"
                loading="lazy"
                referrerPolicy="no-referrer"
                onClick={() => openLightbox(0, venue.images.length)}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="%2316a34a"/><text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="white">' + venue.sport + ' Venue</text></svg>';
                }}
              />
            </div>
            <div className="grid grid-rows-2 gap-2">
              {venue.images.slice(1, 3).map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${venue.name} ${index + 2}`}
                  className="w-full h-49 object-cover rounded-lg cursor-pointer hover:brightness-90 transition-all"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onClick={() => openLightbox(index + 1, venue.images.length)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="%2316a34a"/><text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="16" fill="white">' + venue.sport + '</text></svg>';
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
            onClick={closeLightbox}
          >
            <X size={24} />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
            {lightboxIndex + 1} / {venue.images.length}
          </div>

          {/* Prev */}
          <button
            className="absolute left-4 text-white bg-white/10 hover:bg-white/25 rounded-full p-3 transition"
            onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
          >
            <ChevronLeft size={32} />
          </button>

          {/* Image */}
          <img
            src={venue.images[lightboxIndex]}
            alt={`${venue.name} ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            referrerPolicy="no-referrer"
          />

          {/* Next */}
          <button
            className="absolute right-4 text-white bg-white/10 hover:bg-white/25 rounded-full p-3 transition"
            onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
          >
            <ChevronRight size={32} />
          </button>

          {/* Dot indicators */}
          {venue.images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {venue.images.map((_, i) => (
                <button
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition ${
                    i === lightboxIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
                  }`}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin size={18} className="mr-1" />
                    <span>{venue.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 font-semibold">{venue.rating}</span>
                    <span className="ml-1 text-gray-600">({venue.reviews} reviews)</span>
                  </div>
                </div>
                <div className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold">
                  {venue.sport}
                </div>
              </div>
              
              <p className="text-gray-700 leading-relaxed">{venue.description}</p>
            </div>
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {venue.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2 text-gray-700">
                    <div className="text-primary-600">{amenity.icon}</div>
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ground Rules</h2>
              <ul className="space-y-2">
                {venue.rules.map((rule, index) => (
                  <li key={index} className="flex items-start space-x-2 text-gray-700">
                    <CheckCircle size={20} className="text-primary-600 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-6" id="review-section">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
                {user && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    {showReviewForm ? 'Cancel' : 'Add Review'}
                  </button>
                )}
              </div>
              
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Submit Your Review</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Booking ID *
                    </label>
                    <input
                      type="text"
                      name="bookingId"
                      value={reviewForm.bookingId}
                      onChange={handleReviewInputChange}
                      placeholder="Enter your booking ID"
                      className="input-field"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">You can find your booking ID in My Bookings</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating *
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                          className="focus:outline-none"
                        >
                          <Star
                            size={28}
                            className={`w-8 h-8 ${
                              star <= reviewForm.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Review *
                    </label>
                    <textarea
                      name="comment"
                      value={reviewForm.comment}
                      onChange={handleReviewInputChange}
                      placeholder="Share your experience..."
                      rows="4"
                      className="input-field"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
              
              <div className="space-y-6">
                {reviews && reviews.length > 0 ? (
                  reviews.map(review => (
                    <div key={review._id || review.id} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex items-start space-x-4">
                        <img
                          src={review.avatar || FALLBACK_AVATAR}
                          alt={review.playerName || review.user}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{review.playerName || review.user}</h4>
                              <span className="text-sm text-gray-500">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : review.date}</span>
                            </div>
                            <div className="flex">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review this venue!</p>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20">
              <div className="mb-6">
                <div className="flex items-baseline mb-2">
                  <span className="text-3xl font-bold text-primary-600">₹{venue.price}</span>
                  <span className="text-gray-600 ml-2">/hour</span>
                </div>
                <p className="text-sm text-gray-500">Peak hours: ₹{venue.peakPrice}/hour</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                  />
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Time Slots
                    </label>
                    {loadingSlots ? (
                      <div className="text-center py-4 text-sm text-gray-500">Loading slots...</div>
                    ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {venue.slots.map((slot, index) => {
                        const startTime = slot.time.split(' - ')[0];
                        const isBooked = bookedTimes.includes(startTime);
                        const isClosed = closedTimes.includes(startTime);
                        const isUnavailable = isBooked || isClosed || !slot.available;
                        const status = isBooked ? 'booked' : isClosed ? 'closed' : slot.available ? 'available' : 'unavailable';
                        return (
                        <button
                          key={index}
                          onClick={() => !isUnavailable && setSelectedSlot(slot)}
                          disabled={isUnavailable}
                          className={`p-2 rounded-lg text-sm font-medium transition text-left ${
                            selectedSlot?.time === slot.time
                              ? 'bg-primary-600 text-white'
                              : status === 'booked'
                              ? 'bg-blue-50 text-blue-400 cursor-not-allowed border border-blue-200'
                              : status === 'closed'
                              ? 'bg-orange-50 text-orange-400 cursor-not-allowed border border-orange-200'
                              : !slot.available
                              ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            {isUnavailable && <Lock size={10} />}
                            {slot.time}
                          </span>
                          <span className="text-xs">
                            {status === 'booked' ? 'Booked'
                              : status === 'closed' ? 'Closed'
                              : `₹${slot.price}`}
                          </span>
                        </button>
                        );
                      })}
                    </div>
                    )}
                    <div className="flex gap-3 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Available</span>
                      <span className="flex items-center gap-1"><Lock size={10} className="text-blue-400" />Booked</span>
                      <span className="flex items-center gap-1"><Lock size={10} className="text-orange-400" />Closed</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleBooking}
                className="w-full btn-primary mb-4"
              >
                Book Now
              </button>

              <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Clock size={16} />
                  <span>{venue.openingHours}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone size={16} />
                  <span>{venue.contact.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail size={16} />
                  <span>{venue.contact.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetailPage;

