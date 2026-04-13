import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VenuesPage from './pages/VenuesPage';
import VenueDetailPage from './pages/VenueDetailPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';

import PlayerDashboard from './pages/player/PlayerDashboard';
import PlayerBookings from './pages/player/PlayerBookings';
import PlayerTeams from './pages/player/PlayerTeams';
import CreateTeam from './pages/player/CreateTeam';
import PlayerDisputes from './pages/player/PlayerDisputes';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import VenueManagement from './pages/owner/VenueManagement';
import ScheduleManagement from './pages/owner/ScheduleManagement';
import EarningsPage from './pages/owner/EarningsPage';
import OwnerProfilePage from './pages/owner/OwnerProfilePage';

import AdminDashboard from './pages/admin/AdminDashboard';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <Navbar />}
      <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/venues" element={<VenuesPage />} />
              <Route path="/venues/:id" element={<VenueDetailPage />} />
              <Route 
                path="/booking" 
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/player/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['PLAYER']}>
                    <PlayerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/player/bookings" 
                element={
                  <ProtectedRoute allowedRoles={['PLAYER']}>
                    <PlayerBookings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/player/teams" 
                element={
                  <ProtectedRoute allowedRoles={['PLAYER']}>
                    <PlayerTeams />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/player/teams/create" 
                element={
                  <ProtectedRoute allowedRoles={['PLAYER']}>
                    <CreateTeam />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/player/disputes" 
                element={
                  <ProtectedRoute allowedRoles={['PLAYER']}>
                    <PlayerDisputes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/owner/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/owner/venues" 
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <VenueManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/owner/schedule/:venueId" 
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <ScheduleManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/owner/earnings" 
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <EarningsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/owner/profile" 
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <OwnerProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="*" 
                element={
                  <div className="min-h-screen bg-primary-50/70 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-xl text-gray-600 mb-8">Page not found</p>
                      <a href="/" className="btn-primary">
                        Go Home
                      </a>
                    </div>
                  </div>
                } 
              />
            </Routes>
          </main>
          {!isAdminRoute && <Footer />}
        </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;


