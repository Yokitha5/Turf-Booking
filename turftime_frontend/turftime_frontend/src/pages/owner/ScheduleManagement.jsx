import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Lock, Unlock, AlertCircle, RefreshCw, CalendarDays } from 'lucide-react';
import { useParams } from 'react-router-dom';
import bookingService from '../../services/bookingService';

const ScheduleManagement = () => {
  const { venueId } = useParams();
  
  const BASE_SLOTS = [
    { id: 1, time: '06:00 - 07:00' },
    { id: 2, time: '07:00 - 08:00' },
    { id: 3, time: '08:00 - 09:00' },
    { id: 4, time: '09:00 - 10:00' },
    { id: 5, time: '10:00 - 11:00' },
    { id: 6, time: '11:00 - 12:00' },
    { id: 7, time: '15:00 - 16:00' },
    { id: 8, time: '16:00 - 17:00' },
  ];

  const [currentDate, setCurrentDate] = useState(new Date());
  const dateInputRef = useRef(null);
  const [slots, setSlots] = useState(
    BASE_SLOTS.map(s => ({ ...s, status: 'available', booked: false, customer: null }))
  );
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Use local date parts to avoid UTC timezone shifting the date back by 1 day in IST
  const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const closedKey = `closed_slots_${venueId}_${dateKey}`;

  // Helper: extract a display name from email or full name string
  const toDisplayName = (value) => {
    if (!value) return 'Unknown';
    if (value.includes('@')) {
      // e.g. "revathi@gmail.com" → "Revathi"
      const namePart = value.split('@')[0].replace(/[._\-]/g, ' ');
      return namePart.replace(/\b\w/g, c => c.toUpperCase());
    }
    return value;
  };

  // Fetch real bookings + merge closed slots from localStorage on date/venue change
  const fetchSlots = useCallback(() => {
    if (!venueId) return;
    setLoadingSlots(true);
    const stored = localStorage.getItem(closedKey);
    const closedTimes = stored ? JSON.parse(stored) : [];

    bookingService.getBookingsByVenue(venueId, dateKey)
      .then(res => {
        const bookingMap = {};
        if (res.success && Array.isArray(res.data)) {
          res.data.forEach(b => {
            const start = b.startTime?.substring(0, 5);
            if (start) {
              bookingMap[start] = toDisplayName(b.playerName || b.playerEmail);
            }
          });
        }
        setSlots(BASE_SLOTS.map(slot => {
          const startTime = slot.time.split(' - ')[0];
          if (bookingMap[startTime]) {
            return { ...slot, status: 'booked', booked: true, customer: bookingMap[startTime] };
          } else if (closedTimes.includes(startTime)) {
            return { ...slot, status: 'closed', booked: false, customer: null };
          }
          return { ...slot, status: 'available', booked: false, customer: null };
        }));
        setLastRefreshed(new Date());
      })
      .catch(() => {
        setSlots(BASE_SLOTS.map(slot => {
          const startTime = slot.time.split(' - ')[0];
          return {
            ...slot,
            status: closedTimes.includes(startTime) ? 'closed' : 'available',
            booked: false,
            customer: null,
          };
        }));
      })
      .finally(() => setLoadingSlots(false));
  }, [dateKey, venueId, closedKey]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots, refreshCount]);

  // Auto-refresh every 30 seconds to pick up new bookings automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCount(c => c + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Persist closed slots to localStorage whenever slots change
  const persistClosedSlots = (updatedSlots) => {
    const closedTimes = updatedSlots
      .filter(s => !s.booked && s.status === 'closed')
      .map(s => s.time.split(' - ')[0]);
    localStorage.setItem(closedKey, JSON.stringify(closedTimes));
  };

  const [selectedSlots, setSelectedSlots] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const venueName = 'Green Field Cricket Ground';
  const dateString = currentDate.toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const toggleSlot = (slotId) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter(id => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  const toggleSlotStatus = (slotId) => {
    setSlots(prev => {
      const updated = prev.map(slot => {
        if (slot.id === slotId && !slot.booked) {
          return {
            ...slot,
            status: slot.status === 'available' ? 'closed' : 'available'
          };
        }
        return slot;
      });
      persistClosedSlots(updated);
      return updated;
    });
  };

  const bulkToggleMaintenance = () => {
    if (selectedSlots.length === 0) return;
    setSlots(prev => {
      const updated = prev.map(slot => {
        if (selectedSlots.includes(slot.id) && !slot.booked) {
          return {
            ...slot,
            status: slot.status === 'closed' ? 'available' : 'closed'
          };
        }
        return slot;
      });
      persistClosedSlots(updated);
      return updated;
    });
    setSelectedSlots([]);
  };

  const getSlotStats = () => {
    const available = slots.filter(s => s.status === 'available').length;
    const booked = slots.filter(s => s.booked).length;
    const closed = slots.filter(s => s.status === 'closed').length;
    return { available, booked, closed };
  };

  const stats = getSlotStats();

  return (
    <div className="page-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Management</h1>
          <p className="text-gray-600">{venueName}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Available Slots</p>
            <p className="text-3xl font-bold text-green-600">{stats.available}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Booked Slots</p>
            <p className="text-3xl font-bold text-blue-600">{stats.booked}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Closed for Maintenance</p>
            <p className="text-3xl font-bold text-orange-600">{stats.closed}</p>
          </div>
        </div>
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            
            <div className="text-center flex-1 relative">
              <button
                onClick={() => dateInputRef.current?.showPicker()}
                className="inline-flex items-center gap-2 hover:text-primary-600 transition-colors group"
                title="Click to pick a date"
              >
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-primary-600">{dateString}</h2>
                <CalendarDays size={20} className="text-gray-400 group-hover:text-primary-600" />
              </button>
              <input
                ref={dateInputRef}
                type="date"
                className="sr-only"
                value={dateKey}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    setCurrentDate(new Date(y, m - 1, d));
                  }
                }}
              />
            </div>
            
            <button
              onClick={handleNextDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={24} className="text-gray-700" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="flex-1 btn-outline text-sm"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7*24*60*60*1000))}
              className="flex-1 btn-outline text-sm"
            >
              Next Week
            </button>
          </div>
        </div>
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Time Slots</h2>
            <div className="flex items-center gap-3">
              {lastRefreshed && (
                <span className="text-xs text-gray-400">
                  Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={() => setRefreshCount(c => c + 1)}
                disabled={loadingSlots}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <RefreshCw size={14} className={loadingSlots ? 'animate-spin' : ''} />
                Refresh
              </button>
              <div className="text-sm text-gray-600">
                {selectedSlots.length} selected
              </div>
            </div>
          </div>

          {loadingSlots && (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
              <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Loading slots...
            </div>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 ${loadingSlots ? 'opacity-40 pointer-events-none' : ''}`}>
            {slots.map(slot => (
              <div
                key={slot.id}
                onClick={() => !slot.booked && toggleSlot(slot.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedSlots.includes(slot.id)
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${slot.booked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{slot.time}</p>
                    <p className="text-sm text-gray-600">
                      {slot.booked 
                        ? `Booked by ${slot.customer}`
                        : slot.status === 'available'
                        ? 'Available'
                        : 'Closed for Maintenance'
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!slot.booked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSlotStatus(slot.id);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          slot.status === 'available'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                      >
                        {slot.status === 'available' ? (
                          <Unlock size={18} />
                        ) : (
                          <Lock size={18} />
                        )}
                      </button>
                    )}
                    
                    <div className={`w-4 h-4 rounded-full ${
                      slot.booked
                        ? 'bg-blue-600'
                        : slot.status === 'available'
                        ? 'bg-green-600'
                        : 'bg-orange-600'
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selectedSlots.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle size={20} className="text-blue-600" />
                <span className="text-blue-900 font-medium">
                  {selectedSlots.length} slot(s) selected
                </span>
              </div>
              <button
                onClick={bulkToggleMaintenance}
                className="btn-outline text-sm"
              >
                Toggle Maintenance
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-4 h-4 rounded-full bg-green-600" />
            <span className="text-gray-700">Available</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-4 h-4 rounded-full bg-blue-600" />
            <span className="text-gray-700">Booked</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-4 h-4 rounded-full bg-orange-600" />
            <span className="text-gray-700">Closed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagement;

