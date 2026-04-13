import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Eye, CheckCircle, XCircle, Clock, Download, Star, Building2 } from 'lucide-react';
import Tooltip from '../../components/Tooltip';
import venueService from '../../services/venueService';
import Toast from '../../components/Toast';
import { adminService } from '../../services/adminService';

const VenueManagement = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const toList = (r) => (r?.success && Array.isArray(r.data) ? r.data : []);

      // Get active venues + fetch all owner-based venues to include non-active ones
      const [activeRes, usersRes] = await Promise.all([
        venueService.getAllVenues(),
        adminService.getAllUsers(),
      ]);
      const activeVenues = toList(activeRes);
      const users = toList(usersRes);
      const owners = users.filter(u =>
        ['owner','venue_owner','OWNER','VENUE_OWNER'].includes(u.role)
      );
      const ownerResults = await Promise.all(
        owners.map(u => venueService.getVenuesByOwner(u.email))
      );
      const allOwnerVenues = ownerResults.flatMap(r => toList(r));

      // Merge active + owner venues, deduplicate by id
      const venueMap = new Map();
      [...activeVenues, ...allOwnerVenues].forEach(v => venueMap.set(v.id, v));
      const allVenues = Array.from(venueMap.values());

      const normalise = (v, idx) => ({
        id:            v.id || idx + 1,
        name:          v.name || '—',
        owner:         v.ownerName || (v.ownerEmail ? v.ownerEmail.split('@')[0] : '—'),
        email:         v.ownerEmail || '—',
        phone:         v.phone || v.ownerPhone || '—',
        location:      v.location || v.city || '—',
        sports:        v.sport ? [v.sport] : (v.sports || []),
        rating:        v.rating || 0,
        bookings:      v.bookings || 0,
        revenue:       v.revenue ? `₹${v.revenue}` : '₹0',
        status:        (v.status || 'active').toLowerCase(),
        submittedDate: v.createdAt ? v.createdAt.split('T')[0] : '—',
        documents:     v.documents || [],
      });

      const normalised = (allVenues.length ? allVenues : activeVenues).map(normalise);
      setVenues(normalised);
      setLoading(false);
    };
    load();
  }, []);

  const filteredVenues = venues.filter(venue => {
    const matchesFilter = activeFilter === 'all' || venue.status === activeFilter;
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         venue.owner.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    all: venues.length,
    pending: venues.filter(v => v.status === 'pending').length,
    approved: venues.filter(v => v.status === 'approved').length,
    rejected: venues.filter(v => v.status === 'rejected').length,
  };

  const handleApprove = async (venueId) => {
    const venue = venues.find(v => v.id === venueId);
    if (!venue) return;
    const result = await venueService.updateVenue(venueId, { status: 'active' });
    if (result.success) {
      setVenues(prev => prev.map(v => v.id === venueId ? { ...v, status: 'active' } : v));
    } else {
      showToast(result.message || 'Failed to approve venue', 'error');
    }
  };

  const handleReject = async (venueId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    const result = await venueService.updateVenue(venueId, { status: 'inactive' });
    if (result.success) {
      setVenues(prev => prev.map(v => v.id === venueId ? { ...v, status: 'rejected', rejectionReason: reason } : v));
    } else {
      showToast(result.message || 'Failed to reject venue', 'error');
    }
  };

  const handleExportReport = () => {
    const headers = ['Venue ID', 'Name', 'Owner', 'Location', 'Sports', 'Status', 'Submitted Date', 'Rating', 'Bookings', 'Revenue', 'Email', 'Phone'];
    
    const rows = filteredVenues.map(venue => [
      venue.id,
      venue.name,
      venue.owner,
      venue.location,
      venue.sports.join('; '),
      venue.status.toUpperCase(),
      venue.submittedDate,
      venue.rating,
      venue.bookings,
      venue.revenue,
      venue.email,
      venue.phone,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `venues_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading venues…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 pt-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="text-primary-600" size={32} />
              Venue Management
            </h2>
            <p className="text-gray-600 mt-1">Approve and manage sports venues</p>
          </div>
          <Tooltip text="Download venues list as CSV">
            <button 
              onClick={handleExportReport}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-md hover:shadow-lg"
            >
              <Download size={18} />
              Export Report
            </button>
          </Tooltip>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border-l-4 border-gray-400">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">All Venues</p>
                <p className="text-3xl font-bold text-gray-900">{stats.all}</p>
              </div>
              <Building2 className="text-gray-400" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border-l-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="text-orange-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border-l-4 border-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="text-red-500" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by venue name or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({stats.all})
              </button>
              <button
                onClick={() => setActiveFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  activeFilter === 'pending'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setActiveFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  activeFilter === 'approved'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved ({stats.approved})
              </button>
              <button
                onClick={() => setActiveFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  activeFilter === 'rejected'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected ({stats.rejected})
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-4 pb-8">
          {filteredVenues.length > 0 ? (
            filteredVenues.map(venue => (
              <div key={venue.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-200">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                          #{venue.id}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900">{venue.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          venue.status === 'approved' ? 'bg-green-100 text-green-800' :
                          venue.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {venue.status === 'approved' ? '✓' : venue.status === 'pending' ? '⏳' : '✗'} {venue.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Owner: {venue.owner}</p>
                    </div>
                    <Tooltip text="View venue details">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900">
                        <Eye size={20} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Location</p>
                    <div className="flex items-center gap-1 text-gray-900">
                      <MapPin size={14} className="text-primary-600" />
                      <span className="text-sm font-medium">{venue.location}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Sports</p>
                    <p className="text-sm font-medium text-gray-900">{venue.sports.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{venue.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{venue.email}</p>
                  </div>
                </div>
                {venue.status === 'approved' && (
                  <div className="px-6 py-4 bg-linear-to-r from-green-50 to-white grid grid-cols-3 gap-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                        <Star size={18} className="text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Rating</p>
                        <p className="text-lg font-bold text-gray-900">{venue.rating}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                        <Building2 size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Bookings</p>
                        <p className="text-lg font-bold text-gray-900">{venue.bookings}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                        <span className="text-lg font-bold text-green-600">₹</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Revenue</p>
                        <p className="text-lg font-bold text-green-600">{venue.revenue}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {venue.documents.map((doc, idx) => (
                      <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        📄 {doc}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {venue.status === 'pending' && (
                      <>
                        <Tooltip text="Approve this venue">
                          <button
                            onClick={() => handleApprove(venue.id)}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium shadow-sm"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                        </Tooltip>
                        <Tooltip text="Reject this venue submission">
                          <button
                            onClick={() => handleReject(venue.id)}
                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium shadow-sm"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </Tooltip>
                      </>
                    )}
                    {venue.status === 'approved' && (
                      <Tooltip text="View complete venue information">
                        <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition font-medium shadow-sm">
                          <Eye size={16} />
                          View Details
                        </button>
                      </Tooltip>
                    )}
                    {venue.status === 'rejected' && venue.rejectionReason && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="text-sm text-red-700 font-medium">Reason: {venue.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">No venues found</p>
              <p className="text-sm text-gray-400 mt-1">Try changing the filter or search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueManagement;

