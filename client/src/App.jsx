import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';

// Public pages
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import FindRides from './pages/FindRides.jsx';

// Lazy-load everything else to keep initial bundle small
import { lazy, Suspense } from 'react';
import { LoadingPage } from './components/ui.jsx';

const WomenOnlyRides = lazy(() => import('./pages/WomenOnlyRides.jsx'));
const RideDetails = lazy(() => import('./pages/RideDetails.jsx'));

// Passenger
const PassengerDashboard = lazy(() => import('./pages/PassengerDashboard.jsx'));
const MyBookings = lazy(() => import('./pages/MyBookings.jsx'));
const BookingDetails = lazy(() => import('./pages/BookingDetails.jsx'));
const EmergencyContacts = lazy(() => import('./pages/EmergencyContacts.jsx'));
const FavouritesPage = lazy(() => import('./pages/FavouritesPage.jsx'));

// Driver
const DriverRegisterPage = lazy(() => import('./pages/DriverRegisterPage.jsx'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard.jsx'));
const CreateRide = lazy(() => import('./pages/CreateRide.jsx'));
const EditRide = lazy(() => import('./pages/EditRide.jsx'));
const MyRides = lazy(() => import('./pages/MyRides.jsx'));
const BookingRequests = lazy(() => import('./pages/BookingRequests.jsx'));
const VehicleManagement = lazy(() => import('./pages/VehicleManagement.jsx'));
const SavedRoutes = lazy(() => import('./pages/SavedRoutes.jsx'));

// Shared
const UserProfile = lazy(() => import('./pages/UserProfile.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const PaymentHistory = lazy(() => import('./pages/PaymentHistory.jsx'));
const Support = lazy(() => import('./pages/Support.jsx'));

// Admin
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<LoadingPage />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/rides/search" element={<FindRides />} />
                <Route path="/rides/women-only" element={<WomenOnlyRides />} />
                <Route path="/rides/:id" element={<RideDetails />} />

                {/* Authenticated - passenger */}
                <Route path="/dashboard" element={
                  <ProtectedRoute><PassengerDashboard /></ProtectedRoute>
                } />
                <Route path="/bookings" element={
                  <ProtectedRoute><MyBookings /></ProtectedRoute>
                } />
                <Route path="/bookings/:id" element={
                  <ProtectedRoute><BookingDetails /></ProtectedRoute>
                } />
                <Route path="/emergency-contacts" element={
                  <ProtectedRoute><EmergencyContacts /></ProtectedRoute>
                } />
                <Route path="/favourites" element={
                  <ProtectedRoute><FavouritesPage /></ProtectedRoute>
                } />

                {/* Driver registration (any logged-in user) */}
                <Route path="/driver/register" element={
                  <ProtectedRoute><DriverRegisterPage /></ProtectedRoute>
                } />

                {/* Driver-only */}
                <Route path="/driver/dashboard" element={
                  <ProtectedRoute requireDriver><DriverDashboard /></ProtectedRoute>
                } />
                <Route path="/rides/create" element={
                  <ProtectedRoute requireDriver><CreateRide /></ProtectedRoute>
                } />
                <Route path="/rides/:id/edit" element={
                  <ProtectedRoute requireDriver><EditRide /></ProtectedRoute>
                } />
                <Route path="/rides/my" element={
                  <ProtectedRoute requireDriver><MyRides /></ProtectedRoute>
                } />
                <Route path="/booking-requests" element={
                  <ProtectedRoute requireDriver><BookingRequests /></ProtectedRoute>
                } />
                <Route path="/vehicles" element={
                  <ProtectedRoute requireDriver><VehicleManagement /></ProtectedRoute>
                } />
                <Route path="/saved-routes" element={
                  <ProtectedRoute requireDriver><SavedRoutes /></ProtectedRoute>
                } />

                {/* Shared (any authenticated) */}
                <Route path="/profile" element={
                  <ProtectedRoute><UserProfile /></ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute><Notifications /></ProtectedRoute>
                } />
                <Route path="/payments" element={
                  <ProtectedRoute><PaymentHistory /></ProtectedRoute>
                } />
                <Route path="/support" element={
                  <ProtectedRoute><Support /></ProtectedRoute>
                } />

                {/* Admin */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>
                } />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
