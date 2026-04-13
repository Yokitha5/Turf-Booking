import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Filter, Clock, DollarSign, Wifi, Car, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import venueService from '../services/venueService';


const VenuesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [priceRange, _setPriceRange] = useState([0, 5000]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showMap, setShowMap] = useState(true);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Fallback hardcoded venues for development
  const fallbackVenues = [
    {
      id: 1,
      name: 'Playgrounds Cricket Arena',
      sport: 'Cricket',
      location: 'Ramanathapuram, Coimbatore',
      city: 'Coimbatore',
      rating: 4.8,
      reviews: 124,
      price: 2000,
      peakPrice: 3000,
      image: 'https://images.pexels.com/photos/30671910/pexels-photo-30671910.jpeg',
      amenities: ['Parking', 'Changing Room', 'Cafeteria', 'WiFi'],
      availability: 'Available',
      lat: 11.0183,
      lng: 76.9754
    },
    {
      id: 2,
      name: 'Premier Football Academy',
      sport: 'Football',
      location: 'RS Puram, Coimbatore',
      city: 'Coimbatore',
      rating: 4.9,
      reviews: 98,
      price: 1500,
      peakPrice: 2500,
      image: 'https://images.pexels.com/photos/47354/the-ball-stadion-football-the-pitch-47354.jpeg',
      amenities: ['Parking', 'Floodlights', 'Changing Room'],
      availability: 'Available',
      lat: 11.0142,
      lng: 76.9567
    },
    {
      id: 3,
      name: 'Swift Badminton Courts',
      sport: 'Badminton',
      location: 'Gandhipuram, Coimbatore',
      city: 'Coimbatore',
      rating: 4.7,
      reviews: 156,
      price: 500,
      peakPrice: 800,
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80',
      amenities: ['AC', 'Parking', 'Cafeteria', 'Pro Shop'],
      availability: 'Available',
      lat: 11.0169,
      lng: 76.9703
    },
    {
      id: 4,
      name: 'Elite Tennis Court',
      sport: 'Tennis',
      location: 'Peelamedu, Coimbatore',
      city: 'Coimbatore',
      rating: 4.6,
      reviews: 87,
      price: 800,
      peakPrice: 1200,
      image: 'https://images.pexels.com/photos/8223922/pexels-photo-8223922.jpeg',
      amenities: ['Coaching', 'Parking', 'WiFi'],
      availability: 'Available',
      lat: 11.0108,
      lng: 76.9754
    },
    {
      id: 5,
      name: 'Victory Sports Ground',
      sport: 'Cricket',
      location: 'Saibaba Colony, Coimbatore',
      city: 'Coimbatore',
      rating: 4.9,
      reviews: 203,
      price: 2500,
      peakPrice: 3500,
      image: 'https://images.pexels.com/photos/33851213/pexels-photo-33851213.jpeg',
      amenities: ['Parking', 'Changing Room', 'Cafeteria', 'WiFi', 'Gym'],
      availability: 'Available',
      lat: 11.0249,
      lng: 76.9729
    },
    {
      id: 6,
      name: 'Kuvera Sports Complex',
      sport: 'Football',
      location: 'Matenahalli, Coimbatore',
      city: 'Coimbatore',
      rating: 4.5,
      reviews: 76,
      price: 1800,
      peakPrice: 2800,
      image: 'https://images.pexels.com/photos/35180876/pexels-photo-35180876.jpeg',
      amenities: ['Parking', 'Floodlights'],
      availability: 'Available',
      lat: 11.0289,
      lng: 76.9654
    },
    {
      id: 7,
      name: 'Aqua Elite Swimming Pool',
      sport: 'Swimming',
      location: 'Race Course, Coimbatore',
      city: 'Coimbatore',
      rating: 4.8,
      reviews: 142,
      price: 300,
      peakPrice: 500,
      image: 'https://images.pexels.com/photos/1263425/pexels-photo-1263425.jpeg',
      amenities: ['Changing Room', 'Coaching', 'Cafeteria', 'Locker', 'WiFi'],
      availability: 'Available',
      lat: 11.0173,
      lng: 76.9650
    },
    {
      id: 8,
      name: 'SwimZone Olympic Pool',
      sport: 'Swimming',
      location: 'Ukkadam, Coimbatore',
      city: 'Coimbatore',
      rating: 4.9,
      reviews: 178,
      price: 350,
      peakPrice: 600,
      image: 'https://images.pexels.com/photos/8688171/pexels-photo-8688171.jpeg',
      amenities: ['Parking', 'Coaching', 'Cafeteria', 'Locker', 'Changing Room'],
      availability: 'Available',
      lat: 11.0129,
      lng: 76.9723
    },
    {
      id: 9,
      name: 'Splash Water Sports Center',
      sport: 'Swimming',
      location: 'Brookefields, Coimbatore',
      city: 'Coimbatore',
      rating: 4.7,
      reviews: 91,
      price: 400,
      peakPrice: 700,
      image: 'https://images.pexels.com/photos/8688158/pexels-photo-8688158.jpeg',
      amenities: ['Parking', 'Coaching', 'Cafeteria', 'Sauna', 'WiFi', 'Gym'],
      availability: 'Available',
      lat: 11.0191,
      lng: 76.9892
    },
    {
      id: 10,
      name: 'Hoop Dreams Basketball Court',
      sport: 'Basketball',
      location: 'Saibaba Colony, Coimbatore',
      city: 'Coimbatore',
      rating: 4.8,
      reviews: 134,
      price: 800,
      peakPrice: 1200,
      image: 'https://images.pexels.com/photos/2304345/pexels-photo-2304345.jpeg',
      amenities: ['Floodlights', 'Parking', 'Changing Room', 'Cafeteria'],
      availability: 'Available',
      lat: 11.0249,
      lng: 76.9730
    },
    {
      id: 11,
      name: 'Pro Pickleball Arena',
      sport: 'Pickleball',
      location: 'Gandhipuram, Coimbatore',
      city: 'Coimbatore',
      rating: 4.6,
      reviews: 78,
      price: 400,
      peakPrice: 650,
      image: 'https://images.pexels.com/photos/35688558/pexels-photo-35688558.jpeg',
      amenities: ['AC', 'Parking', 'Pro Shop', 'Cafeteria'],
      availability: 'Available',
      lat: 11.0170,
      lng: 76.9704
    },
    {
      id: 12,
      name: 'TT Championship Hall',
      sport: 'Table Tennis',
      location: 'Peelamedu, Coimbatore',
      city: 'Coimbatore',
      rating: 4.7,
      reviews: 102,
      price: 350,
      peakPrice: 550,
      image: 'https://images.pexels.com/photos/709134/pexels-photo-709134.jpeg',
      amenities: ['AC', 'Coaching', 'Cafeteria', 'WiFi', 'Parking'],
      availability: 'Available',
      lat: 11.0108,
      lng: 76.9755
    }
  ];

  // Fetch venues from backend
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        console.log('VenuesPage - Fetching active venues from backend...');
        const result = await venueService.getActiveVenues();
        
        console.log('VenuesPage - Fetch result:', result);
        
        if (result.success) {
          const backendVenues = result.data || [];
          console.log('VenuesPage - Backend returned venues:', backendVenues.length, backendVenues);
          
          // Map backend response to frontend structure
          const mappedVenues = backendVenues.map(venue => {
            // Extract sport from name or description if not provided
            let sport = venue.sport || 'General';
            if (!venue.sport) {
              const text = `${venue.name} ${venue.description}`.toLowerCase();
              if (text.includes('cricket')) sport = 'Cricket';
              else if (text.includes('football') || text.includes('soccer')) sport = 'Football';
              else if (text.includes('badminton')) sport = 'Badminton';
              else if (text.includes('tennis')) sport = 'Tennis';
              else if (text.includes('basketball')) sport = 'Basketball';
              else if (text.includes('swimming') || text.includes('pool')) sport = 'Swimming';
            }
            
            return {
              id: venue.id,
              name: venue.name,
              sport: sport,
              location: venue.location,
              city: venue.location?.split(',')[0] || 'Coimbatore',
              rating: venue.averageRating || 4.5, // Use averageRating from backend
              reviews: venue.totalReviews || 0,
              price: venue.pricePerHour,
              peakPrice: venue.peakPricePerHour || venue.pricePerHour * 1.5,
              image: venue.mediaUrls && venue.mediaUrls.length > 0 
                ? venue.mediaUrls[0] 
                : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%2316a34a"/><text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="white">Sports Venue</text></svg>',
              amenities: venue.amenities || [],
              availability: venue.active ? 'Available' : 'Unavailable',
              lat: venue.latitude || 11.0168,
              lng: venue.longitude || 76.9754,
              openingTime: venue.openingTime,
              closingTime: venue.closingTime,
              slotDuration: venue.slotDuration,
              description: venue.description,
              ownerEmail: venue.ownerEmail
            };
          });
          
          console.log('VenuesPage - Mapped backend venues:', mappedVenues);
          
          // Merge backend venues with fallback demo venues
          const allVenues = [...mappedVenues, ...fallbackVenues];
          console.log('VenuesPage - Total venues (backend + demo):', allVenues.length);
          
          setVenues(allVenues);
          setError(null);
        } else {
          console.error('VenuesPage - Failed to fetch:', result.message);
          setError(result.message || 'Failed to load venues');
          // Show only fallback venues if backend fails
          setVenues(fallbackVenues);
        }
      } catch (err) {
        console.error('VenuesPage - Error fetching venues:', err);
        setError('Failed to load venues. Please try again later.');
        // Show fallback venues if error
        setVenues(fallbackVenues);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  // Venues already contain both backend and demo venues (merged in useEffect)
  const filteredVenues = venues.filter(venue => {
    const matchesSport = selectedSport === 'all' || venue.sport === selectedSport;
    const matchesCity = selectedCity === 'all' || venue.location.includes(selectedCity);
    const matchesPrice = venue.price >= priceRange[0] && venue.price <= priceRange[1];
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSport && matchesCity && matchesPrice && matchesSearch;
  });

  const getAmenityIcon = (amenity) => {
    switch (amenity.toLowerCase()) {
      case 'parking':
      case 'car':
        return <Car size={16} />;
      case 'wifi':
        return <Wifi size={16} />;
      case 'cafeteria':
        return <Utensils size={16} />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!showMap || !mapRef.current) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = () => {
      const L = window.L;
      
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = null;
        mapRef.current.innerHTML = '';
      }

      const map = L.map(mapRef.current).setView([11.0168, 76.9754], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      filteredVenues.forEach(venue => {
        const markerColor = selectedVenue === venue.id ? 'red' : 'blue';
        const customIcon = L.divIcon({
          html: `<div style="background-color: ${markerColor === 'red' ? '#dc2626' : '#2563eb'}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${venue.name.charAt(0)}</div>`,
          className: 'custom-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });

        L.marker([venue.lat, venue.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`<div style="font-size: 14px;"><strong>${venue.name}</strong><br/>${venue.location}<br/>₹${venue.price}/hour</div>`)
          .on('click', () => {
            setSelectedVenue(venue.id);
            document.getElementById(`venue-${venue.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
      });
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [filteredVenues, selectedVenue, showMap]);

  return (
    <div className="page-bg">
      <div className="bg-primary-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Find Your Perfect Venue</h1>
          <p className="text-xl text-primary-100">Browse and book from hundreds of sports venues</p>
        </div>
      </div>
      <div className="bg-white shadow-md -mt-6 relative z-10 mx-4 md:mx-12 rounded-xl p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by venue name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Sports</option>
                <option value="Cricket">Cricket</option>
                <option value="Football">Football</option>
                <option value="Badminton">Badminton</option>
                <option value="Tennis">Tennis</option>
                <option value="Swimming">Swimming</option>
                <option value="Basketball">Basketball</option>
                <option value="Pickleball">Pickleball</option>
                <option value="Table Tennis">Table Tennis</option>
              </select>
            </div>
            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Areas</option>
                <option value="Ramanathapuram">Ramanathapuram</option>
                <option value="RS Puram">RS Puram</option>
                <option value="Gandhipuram">Gandhipuram</option>
                <option value="Peelamedu">Peelamedu</option>
                <option value="Saibaba Colony">Saibaba Colony</option>
                <option value="Matenahalli">Matenahalli</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading venues...</p>
          </div>
        )}
        
        {!loading && (
        <>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredVenues.length} Venues Found
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => setShowMap(!showMap)}
              className="flex items-center space-x-2 text-primary-600 font-medium hover:text-primary-700"
            >
              <MapPin size={20} />
              <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center space-x-2 text-primary-600"
            >
              <Filter size={20} />
              <span>Filters</span>
            </button>
          </div>
        </div>
        {showMap && (
          <div className="mb-12 rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <div ref={mapRef} style={{ height: '400px', width: '100%' }}></div>
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVenues.map(venue => (
            <Link
              key={venue.id}
              id={`venue-${venue.id}`}
              to={`/venues/${venue.id}`}
              className="card overflow-hidden group transition-all flex flex-col"
              onMouseEnter={() => setSelectedVenue(venue.id)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={venue.image}
                  alt={venue.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%2316a34a"/><text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="white">' + venue.sport + ' Venue</text></svg>';
                  }}
                />
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-primary-600">
                  {venue.sport}
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{venue.name}</h3>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin size={16} className="mr-1" />
                  <span className="text-sm">{venue.location}</span>
                </div>
                
                <div className="flex items-center mb-4 gap-1.5">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(i => {
                      const filled = venue.rating >= i;
                      const half = !filled && venue.rating >= i - 0.5;
                      return (
                        <svg key={i} className="w-4 h-4" viewBox="0 0 24 24">
                          {half ? (
                            <>
                              <defs>
                                <linearGradient id={`hg-${venue.id}-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="50%" stopColor="#F59E0B" />
                                  <stop offset="50%" stopColor="#D1D5DB" />
                                </linearGradient>
                              </defs>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={`url(#hg-${venue.id}-${i})`} />
                            </>
                          ) : (
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={filled ? '#F59E0B' : '#D1D5DB'} />
                          )}
                        </svg>
                      );
                    })}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{venue.rating}</span>
                  <span className="text-gray-500 text-sm">({venue.reviews})</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4 flex-1 content-start">
                  {venue.amenities.slice(0, 3).map((amenity, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs flex items-center space-x-1">
                      {getAmenityIcon(amenity)}
                      <span>{amenity}</span>
                    </span>
                  ))}
                  {venue.amenities.length > 3 && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      +{venue.amenities.length - 3} more
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t mt-auto">
                  <div>
                    <span className="text-2xl font-bold text-primary-600">₹{venue.price}</span>
                    <span className="text-gray-600 text-sm">/hr</span>
                  </div>
                  <span className="btn-primary text-sm py-2">Book Now</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredVenues.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default VenuesPage;

