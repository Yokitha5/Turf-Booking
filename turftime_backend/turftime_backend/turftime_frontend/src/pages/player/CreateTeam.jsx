import { useState } from 'react';
import { ArrowLeft, Users, Trophy, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createTeam } from '../../services/teamService';
import { useAuth } from '../../context/AuthContext';

const CreateTeam = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    teamName: '',
    sport: '',
    description: '',
    location: '',
    teamSize: '',
    skillLevel: '',
    playingDays: [],
    preferredTime: '',
    lookingForPlayers: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamCreated, setTeamCreated] = useState(false);
  const [teamId, setTeamId] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const sports = ['Cricket', 'Football', 'Basketball', 'Badminton', 'Tennis', 'Volleyball', 'Kabaddi', 'Hockey'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'playingDays') {
      setFormData(prev => ({
        ...prev,
        playingDays: checked 
          ? [...prev.playingDays, value]
          : prev.playingDays.filter(day => day !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      name: formData.teamName,
      sport: formData.sport,
      description: formData.description,
      location: formData.location,
      teamSize: Number(formData.teamSize),
      skillLevel: formData.skillLevel,
      playingDays: formData.playingDays,
      preferredTime: formData.preferredTime,
      lookingForPlayers: formData.lookingForPlayers,
      captainEmail: user?.email ?? '',
    };

    try {
      const created = await createTeam(payload, token);
      setTeamId(created.id ?? ('TM' + Date.now().toString().slice(-6)));
      setTeamCreated(true);
      setTimeout(() => navigate('/player/teams'), 2500);
    } catch (err) {
      setSubmitError(err.message ?? 'Failed to create team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (teamCreated) {
    return (
      <div className="page-bg flex items-center justify-center py-20">
        <div className="card p-12 max-w-md text-center shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Team Created!</h2>
          <p className="text-gray-600 mb-6">
            {formData.teamName} has been successfully created. Start inviting players now!
          </p>
          <div className="bg-primary-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-1">Team ID</p>
            <p className="text-2xl font-bold text-primary-600">{teamId}</p>
          </div>
          <button
            onClick={() => navigate('/player/teams')}
            className="btn-primary w-full"
          >
            View My Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            to="/player/teams" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 font-medium"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Teams
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Team</h1>
          <p className="text-gray-600">Build your squad and start playing together</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 bg-white/94 border-primary-100/60 shadow-xl shadow-primary-900/12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Users className="mr-2 text-primary-600" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Team Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="teamName"
                  required
                  value={formData.teamName}
                  onChange={handleInputChange}
                  placeholder="e.g., Thunder Warriors"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Sport <span className="text-red-600">*</span>
                </label>
                <select
                  name="sport"
                  required
                  value={formData.sport}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select a sport</option>
                  {sports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Team Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Tell others about your team's goals and playing style..."
                  className="input-field"
                />
              </div>
            </div>
          </div>
          <div className="card p-6 bg-white/94 border-primary-100/60 shadow-xl shadow-primary-900/12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Trophy className="mr-2 text-primary-600" />
              Team Details
            </h2>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Location <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Coimbatore, Tamil Nadu"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Team Size <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="teamSize"
                    required
                    min="2"
                    max="50"
                    value={formData.teamSize}
                    onChange={handleInputChange}
                    placeholder="Number of players"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Skill Level <span className="text-red-600">*</span>
                </label>
                <select
                  name="skillLevel"
                  required
                  value={formData.skillLevel}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select skill level</option>
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Playing Days
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {weekDays.map(day => (
                    <label key={day} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="playingDays"
                        value={day}
                        checked={formData.playingDays.includes(day)}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Preferred Playing Time
                </label>
                <select
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select time slot</option>
                  <option value="morning">Morning (6 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                  <option value="evening">Evening (6 PM - 10 PM)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="lookingForPlayers"
                    checked={formData.lookingForPlayers}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500 mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Looking for Players</span>
                    <span className="text-xs text-gray-600">Allow other players to find and request to join your team</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <div className="card p-6 bg-linear-to-br from-primary-50/80 to-white/90 border-primary-100/60 shadow-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Team Creation Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span>Choose a unique and memorable team name</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span>Be clear about your team's skill level to match with right opponents</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span>Add a detailed description to attract like-minded players</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span>Select playing days that work for most of your team members</span>
              </li>
            </ul>
          </div>
          {submitError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
              ⚠️ {submitError}
            </div>
          )}
          <div className="flex gap-4">
            <Link
              to="/player/teams"
              className="flex-1 px-8 py-4 bg-white border-2 border-primary-600 text-primary-700 rounded-full hover:bg-primary-50 font-semibold text-center transition-all duration-200 shadow-sm hover:shadow-md text-lg"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-8 py-4 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-full font-semibold shadow-lg hover:from-primary-700 hover:to-primary-800 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg transform hover:-translate-y-0.5"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Team...
                </span>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeam;


