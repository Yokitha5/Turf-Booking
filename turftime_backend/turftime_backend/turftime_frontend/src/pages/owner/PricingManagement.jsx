import { useState } from 'react';
import { Save, Plus, Trash2, AlertCircle, TrendingUp } from 'lucide-react';
import Toast from '../../components/Toast';
import { useParams } from 'react-router-dom';

const PricingManagement = () => {
  const { venueId } = useParams();
  const venueName = 'Green Field Cricket Ground';

  const [basePrice, setBasePrice] = useState(3000);
  const [peakPrice, setPeakPrice] = useState(4500);
  const [discounts, setDiscounts] = useState([
    { id: 1, type: 'advance', description: 'Book 7 days in advance', percentage: 10 },
    { id: 2, type: 'bulk', description: 'Book 4+ slots', percentage: 15 },
    { id: 3, type: 'weekend', description: 'Weekend bookings', percentage: -20 }
  ]);

  const [peakHours, setPeakHours] = useState([
    { id: 1, day: 'Saturday', start: '16:00', end: '21:00' },
    { id: 2, day: 'Sunday', start: '16:00', end: '21:00' },
    { id: 3, day: 'Weekdays', start: '18:00', end: '21:00' }
  ]);

  const [newDiscount, setNewDiscount] = useState({
    type: 'advance',
    description: '',
    percentage: ''
  });

  const [newPeakHour, setNewPeakHour] = useState({
    day: 'Monday',
    start: '18:00',
    end: '21:00'
  });

  const [savedMessage, setSavedMessage] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSavePricing = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleAddDiscount = () => {
    if (!newDiscount.description || !newDiscount.percentage) {
      showToast('Please fill all fields', 'warning');
      return;
    }
    
    setDiscounts([
      ...discounts,
      {
        id: Math.max(...discounts.map(d => d.id), 0) + 1,
        ...newDiscount,
        percentage: parseInt(newDiscount.percentage)
      }
    ]);
    
    setNewDiscount({
      type: 'advance',
      description: '',
      percentage: ''
    });
  };

  const handleDeleteDiscount = (id) => {
    setDiscounts(discounts.filter(d => d.id !== id));
  };

  const handleAddPeakHour = () => {
    setPeakHours([
      ...peakHours,
      {
        id: Math.max(...peakHours.map(p => p.id), 0) + 1,
        ...newPeakHour
      }
    ]);
    
    setNewPeakHour({
      day: 'Monday',
      start: '18:00',
      end: '21:00'
    });
  };

  const handleDeletePeakHour = (id) => {
    setPeakHours(peakHours.filter(p => p.id !== id));
  };

  const calculateExamplePrice = (slots, isAdvanceBooking = false, isPeak = false) => {
    let price = basePrice * slots;
    
    if (isPeak) {
      price = (peakPrice * slots) + (basePrice * slots);
    }
    
    if (isAdvanceBooking) {
      const advanceDiscount = discounts.find(d => d.type === 'advance');
      if (advanceDiscount) {
        price = price * (1 - advanceDiscount.percentage / 100);
      }
    }
    
    if (slots >= 4) {
      const bulkDiscount = discounts.find(d => d.type === 'bulk');
      if (bulkDiscount) {
        price = price * (1 - bulkDiscount.percentage / 100);
      }
    }
    
    return Math.round(price);
  };

  return (
    <div className="page-bg py-8">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing Management</h1>
          <p className="text-gray-600">{venueName}</p>
        </div>
        {savedMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-600 rounded-full" />
            <span className="text-green-800 font-medium">Pricing settings saved successfully!</span>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Base Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price Per Hour (₹)
                </label>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-primary-600">₹{basePrice}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={basePrice}
                  onChange={(e) => setBasePrice(parseInt(e.target.value))}
                  className="w-full mt-3"
                />
              </div>
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                This is your standard hourly rate for non-peak hours.
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <TrendingUp size={24} className="text-orange-600" />
              <span>Peak Hour Pricing</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peak Hour Price Per Hour (₹)
                </label>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-orange-600">₹{peakPrice}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="15000"
                  step="100"
                  value={peakPrice}
                  onChange={(e) => setPeakPrice(parseInt(e.target.value))}
                  className="w-full mt-3"
                />
              </div>
              <div className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                Applied during peak hours/days defined below.
              </div>
            </div>
          </div>
        </div>
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Price Calculator</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">1 slot, Regular</p>
              <p className="text-2xl font-bold text-primary-600">
                ₹{calculateExamplePrice(1, false, false)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">1 slot, Peak Hours</p>
              <p className="text-2xl font-bold text-orange-600">
                ₹{calculateExamplePrice(1, false, true)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">4 slots, Advance Booking</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{calculateExamplePrice(4, true, false)}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Peak Hours Schedule</h2>
          
          <div className="mb-6">
            <div className="space-y-3">
              {peakHours.map(peak => (
                <div key={peak.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{peak.day}</p>
                    <p className="text-sm text-gray-600">{peak.start} - {peak.end}</p>
                  </div>
                  <button
                    onClick={() => handleDeletePeakHour(peak.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-900 mb-4">Add Peak Hour</p>
            <div className="grid grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                <select
                  value={newPeakHour.day}
                  onChange={(e) => setNewPeakHour({ ...newPeakHour, day: e.target.value })}
                  className="input-field"
                >
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                  <option>Sunday</option>
                  <option>Weekdays</option>
                  <option>Weekends</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start</label>
                <input
                  type="time"
                  value={newPeakHour.start}
                  onChange={(e) => setNewPeakHour({ ...newPeakHour, start: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End</label>
                <input
                  type="time"
                  value={newPeakHour.end}
                  onChange={(e) => setNewPeakHour({ ...newPeakHour, end: e.target.value })}
                  className="input-field"
                />
              </div>
              <button
                onClick={handleAddPeakHour}
                className="btn-primary flex items-center justify-center space-x-1"
              >
                <Plus size={18} />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Discount Offers</h2>
          
          <div className="mb-6">
            <div className="space-y-3">
              {discounts.map(discount => (
                <div key={discount.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{discount.description}</p>
                    <p className="text-sm text-gray-600">
                      {discount.percentage > 0 ? 'Discount' : 'Premium'}: {Math.abs(discount.percentage)}%
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteDiscount(discount.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-900 mb-4">Add Discount Offer</p>
            <div className="grid grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newDiscount.type}
                  onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value })}
                  className="input-field"
                >
                  <option value="advance">Advance Booking</option>
                  <option value="bulk">Bulk Booking</option>
                  <option value="loyalty">Loyalty Program</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newDiscount.description}
                  onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Book 7 days in advance"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Discount %</label>
                <input
                  type="number"
                  value={newDiscount.percentage}
                  onChange={(e) => setNewDiscount({ ...newDiscount, percentage: e.target.value })}
                  className="input-field"
                  placeholder="10"
                  min="0"
                  max="100"
                />
              </div>
              <button
                onClick={handleAddDiscount}
                className="btn-primary flex items-center justify-center space-x-1"
              >
                <Plus size={18} />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start space-x-3">
          <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Pricing Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Set competitive prices compared to nearby venues</li>
              <li>Offer discounts for advance bookings to increase bookings</li>
              <li>Use peak pricing to maximize earnings during high-demand hours</li>
              <li>Monitor booking patterns and adjust prices accordingly</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSavePricing}
            className="btn-primary flex items-center space-x-2"
          >
            <Save size={20} />
            <span>Save Pricing Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingManagement;

