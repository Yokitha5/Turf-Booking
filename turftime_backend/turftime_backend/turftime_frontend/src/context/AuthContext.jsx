/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) return null;
    try {
      const parsed = JSON.parse(storedUser);
      // Validate that email is a real email (not a username from JWT sub)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (parsed && parsed.email && !emailRegex.test(parsed.email)) {
        // Email is invalid (likely username from JWT sub), clear and force re-login
        console.warn('Cached user has invalid email, clearing session...');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  // Fetches full profile from DB and merges it into state + localStorage.
  // Called on startup AND after every login/register so edited fields
  // (name, location, bio, jersey, skills, phone, avatar) are never lost.
  const mergeProfileFromDB = async (baseUser) => {
    try {
      const result = await authService.getMyProfile();
      if (result.success && result.data) {
        const dbUser = result.data;
        const profileFields = {
          name:        dbUser.name,
          phone:       dbUser.phone,
          location:    dbUser.location,
          bio:         dbUser.bio,
          avatar:      dbUser.avatar,
          preferences: dbUser.preferences,
          jersey:      dbUser.jerseyNumber,
          skills:      dbUser.skills
            ? dbUser.skills.split(',').map(s => s.trim()).filter(Boolean)
            : [],
        };
        const merged = { ...(baseUser || {}), ...profileFields };
        sessionStorage.setItem('user', JSON.stringify(merged));
        setUser(merged);
        return merged;
      }
    } catch (_) {
      // Backend unreachable – keep using cached data
    }
    return baseUser;
  };

  // On every app start / refresh, sync from DB so edits survive hard refresh.
  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    if (!storedToken) return;
    const stored = sessionStorage.getItem('user');
    const base = stored ? JSON.parse(stored) : null;
    mergeProfileFromDB(base);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        const userData = result.user;
        setUser(userData);
        setToken(result.token);
        // Immediately fetch full profile from DB so edited fields are restored
        await mergeProfileFromDB(userData);
        return { success: true, user: userData };
      }
      
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const result = await authService.register(userData);
      
      if (result.success) {
        const newUser = result.user;
        setUser(newUser);
        setToken(result.token);
        // Fetch full profile from DB after register
        await mergeProfileFromDB(newUser);
        return { success: true, user: newUser };
      }
      
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const updateProfile = (profileData) => {
    const updatedUser = {
      ...user,
      ...profileData
    };
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isPlayer: user?.role === 'PLAYER',
    isOwner: user?.role === 'OWNER',
    isAdmin: user?.role === 'ADMIN'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

