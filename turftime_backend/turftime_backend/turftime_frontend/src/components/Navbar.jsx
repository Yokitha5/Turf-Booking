import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut, Home, Search, Calendar, Users, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import TurfTimeLogo from './TurfTimeLogo';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'PLAYER':
        return '/player/dashboard';
      case 'OWNER':
        return '/owner/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-primary-900/90 text-primary-50 backdrop-blur supports-[backdrop-filter]:bg-primary-900/80 border-b border-primary-800/60 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <TurfTimeLogo size={48} />
              <span className="text-2xl font-bold bg-linear-to-r from-primary-400 via-primary-200 to-white bg-clip-text text-transparent" style={{WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>TurfTime</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-6 ml-auto">
            {(!user || user.role !== 'OWNER') && (
              <Link to="/venues" className={`transition flex items-center space-x-1 ${isActive('/venues') ? 'text-white font-bold bg-primary-700/60 px-3 py-2 rounded-lg' : 'text-primary-100 hover:text-white'}`}>
                <Search size={18} />
                <span>Find Venues</span>
              </Link>
            )}
            
            {user && (
              <>
                <Link to={getDashboardLink()} className={`transition flex items-center space-x-1 ${isActive(getDashboardLink()) ? 'text-white font-bold bg-primary-700/60 px-3 py-2 rounded-lg' : 'text-primary-100 hover:text-white'}`}>
                  <BarChart3 size={18} />
                  <span>Dashboard</span>
                </Link>
                
                {user.role === 'PLAYER' && (
                  <>
                    <Link to="/player/bookings" className={`transition flex items-center space-x-1 ${isActive('/player/bookings') ? 'text-white font-bold bg-primary-700/60 px-3 py-2 rounded-lg' : 'text-primary-100 hover:text-white'}`}>
                      <Calendar size={18} />
                      <span>My Bookings</span>
                    </Link>
                    <Link to="/player/teams" className={`transition flex items-center space-x-1 ${isActive('/player/teams') ? 'text-white font-bold bg-primary-700/60 px-3 py-2 rounded-lg' : 'text-primary-100 hover:text-white'}`}>
                      <Users size={18} />
                      <span>Teams</span>
                    </Link>
                  </>
                )}

                {user.role === 'OWNER' && (
                  <>
                    <Link to="/owner/venues" className={`transition flex items-center space-x-1 ${isActive('/owner/venues') ? 'text-white font-bold bg-primary-700/60 px-3 py-2 rounded-lg' : 'text-primary-100 hover:text-white'}`}>
                      <Home size={18} />
                      <span>My Venues</span>
                    </Link>
                    <Link to="/owner/earnings" className={`transition flex items-center space-x-1 ${isActive('/owner/earnings') ? 'text-white font-bold bg-primary-700/60 px-3 py-2 rounded-lg' : 'text-primary-100 hover:text-white'}`}>
                      <BarChart3 size={18} />
                      <span>Earnings</span>
                    </Link>
                  </>
                )}
                
                <Link to={user?.role === 'OWNER' ? '/owner/profile' : '/profile'} className="flex items-center space-x-2 text-primary-100 hover:text-white transition">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                  <span className="font-medium">{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-primary-100 hover:text-primary-50 transition flex items-center space-x-1"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            )}

            {!user && (
              <>
                <Link to="/login" className="text-primary-100 hover:text-white transition font-medium">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-primary-50 hover:text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary-900/95 text-primary-50 border-t border-primary-800">
          <div className="px-4 pt-2 pb-4 space-y-3">
            {(!user || user.role !== 'OWNER') && (
              <Link
                to="/venues"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 rounded ${isActive('/venues') ? 'text-white font-bold bg-primary-700/60 px-3' : 'text-primary-100 hover:text-white'}`}
              >
                Find Venues
              </Link>
            )}
            
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 rounded ${isActive(getDashboardLink()) ? 'text-white font-bold bg-primary-700/60 px-3' : 'text-primary-100 hover:text-white'}`}
                >
                  Dashboard
                </Link>
                
                {user.role === 'PLAYER' && (
                  <>
                    <Link
                      to="/player/bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block py-2 rounded ${isActive('/player/bookings') ? 'text-white font-bold bg-primary-700/60 px-3' : 'text-primary-100 hover:text-white'}`}
                    >
                      My Bookings
                    </Link>
                    <Link
                      to="/player/teams"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block py-2 rounded ${isActive('/player/teams') ? 'text-white font-bold bg-primary-700/60 px-3' : 'text-primary-100 hover:text-white'}`}
                    >
                      Teams
                    </Link>
                  </>
                )}

                {user.role === 'OWNER' && (
                  <>
                    <Link
                      to="/owner/venues"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block py-2 rounded ${isActive('/owner/venues') ? 'text-white font-bold bg-primary-700/60 px-3' : 'text-primary-100 hover:text-white'}`}
                    >
                      My Venues
                    </Link>
                    <Link
                      to="/owner/earnings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block py-2 rounded ${isActive('/owner/earnings') ? 'text-white font-bold bg-primary-700/60 px-3' : 'text-primary-100 hover:text-white'}`}
                    >
                      Earnings
                    </Link>
                  </>
                )}
                
                <Link
                  to={user?.role === 'OWNER' ? '/owner/profile' : '/profile'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 rounded ${isActive('/profile') || isActive('/owner/profile') ? 'text-white font-bold bg-primary-700/60 px-3' : 'text-primary-100 hover:text-white'}`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-primary-50 py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-primary-100 hover:text-white py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block btn-primary text-center"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

