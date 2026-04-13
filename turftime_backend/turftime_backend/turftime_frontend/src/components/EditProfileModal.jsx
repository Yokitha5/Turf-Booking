import { useState } from 'react';
import authService from '../services/authService';

const EditProfileModal = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || 'Player Name',
    role: user?.role || 'PLAYER',
    location: user?.location || 'Coimbatore, Tamilnadu',
    availability: user?.availability || 'Weeknights',
    jersey: user?.jersey || '#10',
    bio: user?.bio || '',
    skills: user?.skills || ['Intermediate', 'Competitive', 'Right Footed'],
    avatar: user?.avatar || ''
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setFormData(prev => ({
          ...prev,
          avatar: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSave = async () => {
    const profileData = {
      name: formData.name,
      location: formData.location,
      availability: formData.availability,
      jerseyNumber: formData.jersey,
      bio: formData.bio,
      skills: formData.skills,
      avatar: formData.avatar,
    };
    if (user?.email) {
      await authService.updateProfile(user.email, profileData);
    }
    onSave({
      name: formData.name,
      location: formData.location,
      availability: formData.availability,
      jersey: formData.jersey,
      bio: formData.bio,
      skills: formData.skills,
      avatar: formData.avatar,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-linear-to-r from-primary-50 to-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Edit Profile</h3>
            <p className="text-sm text-gray-500 mt-1">Update your player information and preferences</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center transition"
          >
            ×
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-200">Profile Picture</h4>
            <div className="flex items-center gap-6">
              <img 
                src={avatarPreview || user?.avatar} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
              <div className="flex-1">
                <label className="block">
                  <span className="sr-only">Choose profile photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF (max. 2MB)</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-200">Basic Information</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
                  {formData.role}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-200">Location & Availability</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Availability</label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white appearance-none cursor-pointer"
                >
                  <option value="Weekdays">Weekdays</option>
                  <option value="Weeknights">Weeknights</option>
                  <option value="Weekends">Weekends</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-200">Player Details</h4>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Jersey Number</label>
              <input
                type="text"
                name="jersey"
                value={formData.jersey}
                onChange={handleInputChange}
                placeholder="#10"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
              />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-200">About You</h4>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself, your playing style, and experience..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">{formData.bio.length}/500 characters</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-200">Skills & Preferences</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-4 font-medium">Select all that apply</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Beginner', 'Intermediate', 'Advanced', 'Competitive', 'Right Footed', 'Left Footed'].map(skill => (
                  <button
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition duration-200 ${
                      formData.skills.includes(skill)
                        ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-white hover:border-gray-400 transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition duration-200 shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;

