import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import venueService from '../../services/venueService';
import reviewService from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';

const VenueManagement = () => {
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState(null);
  const [editingVenue, setEditingVenue] = useState(null);
  const [toast, setToast] = useState(null);
  const [venueRatings, setVenueRatings] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const [formData, setFormData] = useState({
    name: '',
    sport: 'Cricket',
    description: '',
    location: '',
    latitude: 11.0168,
    longitude: 76.9754,
    pricePerHour: '',
    openingTime: '06:00',
    closingTime: '23:00',
    slotDuration: 60,
    amenities: [],
    mediaUrls: []
  });

  const sportOptions = ['Cricket', 'Badminton', 'Football', 'Tennis', 'Basketball'];
  const amenitiesOptions = ['Parking', 'Showers', 'Floodlights', 'AC', 'Lockers', 'WiFi', 'Cafe'];

  // Fetch venues on mount
  useEffect(() => {
    const fetchVenues = async () => {
      // Debug: Check user object
      console.log('VenueManagement - User object:', user);
      console.log('VenueManagement - User email:', user?.email);
      console.log('VenueManagement - User sub:', user?.sub);
      
      let ownerEmail = user?.email || user?.sub;
      
      if (!ownerEmail) {
        console.error('No user email found in auth context');
        setError('User email not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Normalize email format (add domain if missing)
      if (!ownerEmail.includes('@')) {
        ownerEmail = `${ownerEmail}@turftime.in`;
      }
      
      try {
        setLoading(true);
        console.log('Fetching venues for owner:', ownerEmail);
        const result = await venueService.getVenuesByOwner(ownerEmail);
        
        console.log('Venues fetch result:', result);
        
        if (result.success) {
          const venuesData = result.data || [];
          console.log('Venues from backend:', venuesData);
          setVenues(venuesData);
          setError(null);
        } else {
          console.error('Failed to fetch venues:', result.message);
          setError(result.message);
          // Don't use fallback, show empty or actual backend venues
          setVenues([]);
        }
      } catch (err) {
        console.error('Error fetching venues:', err);
        setError('Failed to load venues');
        setVenues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [user]);

  // Fetch average ratings for each venue from customer reviews
  useEffect(() => {
    if (!venues.length) return;
    const fetchRatings = async () => {
      const entries = await Promise.all(
        venues.map(async (v) => {
          const res = await reviewService.getAverageRating(v.id);
          const avg = res.success && typeof res.data === 'number' ? res.data : 0;
          return [v.id, avg];
        })
      );
      setVenueRatings(Object.fromEntries(entries));
    };
    fetchRatings();
  }, [venues]);

  const handleAddVenue = () => {
    setEditingVenue(null);
    setFormData({
      name: '',
      sport: 'Cricket',
      description: '',
      location: '',
      latitude: 11.0168,
      longitude: 76.9754,
      pricePerHour: '',
      openingTime: '06:00',
      closingTime: '23:00',
      slotDuration: 60,
      amenities: [],
      mediaUrls: []
    });
    setShowModal(true);
  };

  const handleEditVenue = (venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      sport: venue.sport || 'Cricket',
      description: venue.description || '',
      location: venue.location,
      latitude: venue.latitude || 11.0168,
      longitude: venue.longitude || 76.9754,
      pricePerHour: venue.pricePerHour,
      openingTime: venue.openingTime || '06:00',
      closingTime: venue.closingTime || '23:00',
      slotDuration: venue.slotDuration || 60,
      amenities: venue.amenities || [],
      mediaUrls: venue.mediaUrls || []
    });
    setShowModal(true);
  };

  const handleDeleteClick = (venue) => {
    setVenueToDelete(venue);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!venueToDelete) return;

    try {
      setSubmitting(true);
      console.log('Deleting venue:', venueToDelete.id);
      const result = await venueService.deleteVenue(venueToDelete.id);
      
      if (result.success) {
        showToast('Venue deleted successfully!');
        
        // Refresh venue list from backend
        let ownerEmail = user?.email || user?.sub;
        if (!ownerEmail.includes('@')) {
          ownerEmail = `${ownerEmail}@turftime.in`;
        }
        
        const refreshResult = await venueService.getVenuesByOwner(ownerEmail);
        if (refreshResult.success) {
          setVenues(refreshResult.data || []);
        }
        
        setShowDeleteModal(false);
        setVenueToDelete(null);
      } else {
        showToast(`Failed to delete: ${result.message || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Error deleting venue:', err);
      showToast('Failed to delete venue. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setVenueToDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get owner email from user object (supports both 'email' and 'sub' fields)
    let ownerEmail = user?.email || user?.sub;
    
    console.log('Submit - User object:', user);
    console.log('Submit - Owner email (raw):', ownerEmail);
    
    if (!ownerEmail) {
      showToast('User not authenticated. Please log in again.', 'error');
      console.error('No email found in user object:', user);
      return;
    }

    // Ensure email has valid format for backend validation
    // If it's just a username (no @), append domain
    if (!ownerEmail.includes('@')) {
      ownerEmail = `${ownerEmail}@turftime.in`;
      console.log('Submit - Normalized email:', ownerEmail);
    }

    try {
      setSubmitting(true);
      
      // Prepare data for backend
      const venueData = {
        name: formData.name,
        sport: formData.sport, // Add sport field
        description: formData.description || `${formData.sport} venue in ${formData.location}`,
        ownerEmail: ownerEmail,
        location: formData.location,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        amenities: formData.amenities,
        mediaUrls: formData.mediaUrls.filter(url => url.trim() !== ''),
        pricePerHour: parseFloat(formData.pricePerHour),
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        slotDuration: parseInt(formData.slotDuration)
      };

      console.log('Submitting venue data:', venueData);

      let result;
      if (editingVenue) {
        // Update existing venue
        result = await venueService.updateVenue(editingVenue.id, venueData);
        
        if (result.success) {
          // Update local state
          setVenues(venues.map(v => 
            v.id === editingVenue.id ? result.data : v
          ));
        }
      } else {
        // Create new venue
        result = await venueService.createVenue(venueData);
        
        if (result.success) {
          // Add to local state
          setVenues([...venues, result.data]);
        }
      }

      if (result.success) {
        setShowModal(false);
        setError(null);
        showToast('Venue saved successfully!');
        
        // Refresh venue list after successful save
        let ownerEmail = user?.email || user?.sub;
        if (!ownerEmail.includes('@')) {
          ownerEmail = `${ownerEmail}@turftime.in`;
        }
        
        const refreshResult = await venueService.getVenuesByOwner(ownerEmail);
        if (refreshResult.success) {
          setVenues(refreshResult.data || []);
        }
      } else {
        // Better error display
        let errorMsg = 'Operation failed';
        if (typeof result.message === 'string') {
          errorMsg = result.message;
        } else if (result.message && typeof result.message === 'object') {
          errorMsg = JSON.stringify(result.message, null, 2);
        }
        showToast(`Error: ${errorMsg}`, 'error');
        console.error('Save failed - Full response:', result);
      }
    } catch (err) {
      console.error('Error saving venue:', err);
      showToast(`Failed to save venue: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleAddMediaUrl = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      setFormData(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, url.trim()]
      }));
    }
  };

  const handleImageFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData(prev => ({
          ...prev,
          mediaUrls: [...prev.mediaUrls, ev.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveMediaUrl = (index) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
    }));
  };

  const occupancyRate = (booked, total) => {
    if (!total || total === 0) return 0;
    return Math.round((booked / total) * 100);
  };

  return (
    <div className="page-bg py-8">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            <p className="font-semibold">Notice:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {/* Debug Info - Remove in production */}
        {!user && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <p className="font-semibold">⚠️ Authentication Issue</p>
            <p className="text-sm">No user found. Please log in again.</p>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Venue Management</h1>
            <p className="text-gray-600">Manage your sports grounds and facilities</p>
          </div>
          <button
            onClick={handleAddVenue}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Venue</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading venues...</p>
          </div>
        ) : (
          <>
        <div className="grid md:grid-cols-2 gap-6">
          {venues.map(venue => {
            const displayImage = (venue.mediaUrls && venue.mediaUrls.length > 0)
              ? venue.mediaUrls[0]
              : venue.image
              || null;
            const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%2316a34a"/><text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="white">Sports Venue</text></svg>`;
            const isActive = venue.active !== false && (!venue.status || venue.status === 'active');
            const rating = venueRatings[venue.id] ?? venue.averageRating ?? venue.rating ?? 0;
            
            return (
            <div key={venue.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
              <div 
                className="h-32 bg-cover bg-center relative"
                style={{
                  backgroundImage: `url('${displayImage || placeholderSvg}')`,
                  backgroundColor: '#e5e7eb'
                }}
              >
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => handleEditVenue(venue)}
                    className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
                  >
                    <Edit2 size={18} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(venue)}
                    className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{venue.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <MapPin size={16} />
                      <span>{venue.location}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {isActive ? 'active' : 'inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-t border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Sport Type</p>
                    <p className="font-semibold text-gray-900">{venue.sport || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Price/Hour</p>
                    <p className="font-semibold text-primary-600">₹{venue.pricePerHour}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Rating</p>
                    <p className="font-semibold text-yellow-600">⭐ {rating.toFixed(1)}</p>
                  </div>
                </div>
                {venue.bookedSlots !== undefined && venue.totalSlots && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Today's Occupancy</span>
                    <span className="text-sm font-bold text-primary-600">{occupancyRate(venue.bookedSlots, venue.totalSlots)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${occupancyRate(venue.bookedSlots, venue.totalSlots)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{venue.bookedSlots} of {venue.totalSlots} slots booked</p>
                </div>
                )}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1">
                    {(venue.amenities || []).map((amenity, idx) => (
                      <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                    {(!venue.amenities || venue.amenities.length === 0) && (
                      <span className="text-xs text-gray-500">No amenities listed</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 pt-4">
                  <Link
                    to={`/owner/schedule/${venue.id}`}
                    className="flex-1 btn-outline text-center text-sm flex items-center justify-center space-x-1"
                  >
                    <Clock size={16} />
                    <span>Manage Schedule</span>
                  </Link>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {venues.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No venues added yet</p>
            <button onClick={handleAddVenue} className="btn-primary">
              Create Your First Venue
            </button>
          </div>
        )}
        </>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingVenue ? 'Edit Venue' : 'Add New Venue'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Green Field Cricket Ground"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Sport Type *
                  </label>
                  <select
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    className="input-field"
                  >
                    {sportOptions.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Price Per Hour (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                    className="input-field"
                    placeholder="3000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-field"
                  placeholder="e.g., MG Road, Bangalore"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field resize-none"
                  rows="3"
                  placeholder="Describe your venue..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="input-field"
                    placeholder="11.0168"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="input-field"
                    placeholder="76.9754"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Opening Time *
                  </label>
                  <input
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Closing Time *
                  </label>
                  <input
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Slot Duration (min) *
                  </label>
                  <input
                    type="number"
                    value={formData.slotDuration}
                    onChange={(e) => setFormData({ ...formData, slotDuration: e.target.value })}
                    className="input-field"
                    placeholder="60"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Venue Images <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="space-y-3">
                  {formData.mediaUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {formData.mediaUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Venue ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveMediaUrl(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageFileUpload}
                    />
                    <span className="text-sm text-gray-500">📷 Click to upload images</span>
                  </label>
                  {formData.mediaUrls.length === 0 && (
                    <p className="text-xs text-gray-400">No image uploaded — a default placeholder will be shown.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Amenities
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {amenitiesOptions.map(amenity => (
                    <label key={amenity} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-linear-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : (editingVenue ? 'Update Venue' : 'Add Venue')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && venueToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
            <div className="p-8 text-center">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-red-600" size={32} />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Delete Venue?
              </h2>

              {/* Venue Name */}
              <p className="text-gray-600 mb-1">
                Are you sure you want to delete
              </p>
              <p className="text-lg font-bold text-gray-900 mb-4">
                {venueToDelete.name}
              </p>

              {/* Warning */}
              <p className="text-sm text-red-600 font-semibold mb-6">
                This action cannot be undone.
              </p>

              {/* Info Box */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-2">This will permanently:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Remove all venue details and settings</li>
                      <li>• Cancel all future bookings</li>
                      <li>• Delete booking history</li>
                      <li>• Remove from search results</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
                >
                  No, Keep it
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueManagement;


