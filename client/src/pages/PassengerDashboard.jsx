import { useState, useEffect } from 'react';
import { bookingApi } from '../api/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LoadingPage, EmptyState, StatusBadge, RideTypeBadge, formatDate, formatCurrency, Alert } from '../components/ui.jsx';
import { Link } from 'react-router-dom';
import { CalendarDays, Car, MapPin, Users, CreditCard, Clock, Plus, Search, Shield } from 'lucide-react';

function BookingMiniCard({ booking }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <RideTypeBadge type={booking.ride_type} />
          <StatusBadge status={booking.status} />
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-gray-800 truncate">
          <MapPin size={12} className="text-green-500 flex-shrink-0" />
          <span className="truncate">{booking.origin_address}</span>
          <span className="text-gray-400 mx-1">→</span>
          <span className="truncate">{booking.destination_address}</span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1"><CalendarDays size={11} /> {formatDate(booking.departure_datetime)}</span>
          <span className="flex items-center gap-1"><Car size={11} /> {booking.driver_name}</span>
          <span className="flex items-center gap-1"><Users size={11} /> {booking.seats_booked} seat{booking.seats_booked > 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-bold text-primary-700 text-lg">{formatCurrency(booking.total_amount)}</span>
        <Link to={`/bookings/${booking.id}`} className="btn-secondary text-xs px-3 py-1.5">View</Link>
      </div>
    </div>
  );
}

export default function PassengerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    bookingApi.myBookings().then(r => setBookings(r.data)).catch(() => setError('Failed to load bookings')).finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.departure_datetime) > new Date());
  const pending = bookings.filter(b => b.status === 'pending');
  const completed = bookings.filter(b => b.status === 'completed');
  const cancelled = bookings.filter(b => ['cancelled', 'rejected'].includes(b.status));

  const stats = [
    { label: 'Upcoming', value: upcoming.length, color: 'text-blue-600 bg-blue-50', icon: Clock },
    { label: 'Pending', value: pending.length, color: 'text-yellow-600 bg-yellow-50', icon: Users },
    { label: 'Completed', value: completed.length, color: 'text-green-600 bg-green-50', icon: CreditCard },
    { label: 'Cancelled', value: cancelled.length, color: 'text-red-600 bg-red-50', icon: CalendarDays },
  ];

  const quickActions = [
    { to: '/rides/search', icon: Search, label: 'Find Rides', color: 'bg-primary-50 text-primary-700 border-primary-100', desc: 'Search available rides' },
    { to: '/rides/women-only', icon: Shield, label: 'Women-Only Rides', color: 'bg-pink-50 text-pink-700 border-pink-100', desc: 'Safe rides for women' },
    { to: '/emergency-contacts', icon: Users, label: 'Emergency Contact', color: 'bg-orange-50 text-orange-700 border-orange-100', desc: 'Safety contact setup' },
    { to: '/payments', icon: CreditCard, label: 'Payment History', color: 'bg-blue-50 text-blue-700 border-blue-100', desc: 'View all payments' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hello, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Welcome back to WayShare. Ready for your next ride?</p>
      </div>

      {loading ? <LoadingPage /> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {stats.map(s => (
              <div key={s.label} className="card">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {error && <Alert type="error" message={error} />}

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {quickActions.map(a => (
                <Link key={a.to} to={a.to} className={`card border hover:shadow-md transition-all ${a.color}`}>
                  <a.icon size={22} className="mb-2" />
                  <p className="font-semibold text-sm">{a.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{a.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Requests ({pending.length})</h2>
              <div className="space-y-3">
                {pending.slice(0, 3).map(b => <BookingMiniCard key={b.id} booking={b} />)}
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Upcoming Rides</h2>
              <Link to="/bookings" className="text-sm text-primary-600 hover:underline">View all →</Link>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No upcoming rides"
                description="Search for rides and book your next journey."
                action={<Link to="/rides/search" className="btn-primary inline-block">Find Rides</Link>}
              />
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 5).map(b => <BookingMiniCard key={b.id} booking={b} />)}
              </div>
            )}
          </div>

          {completed.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Trips</h2>
                <Link to="/bookings" className="text-sm text-primary-600 hover:underline">View all →</Link>
              </div>
              <div className="space-y-3">
                {completed.slice(0, 3).map(b => <BookingMiniCard key={b.id} booking={b} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
