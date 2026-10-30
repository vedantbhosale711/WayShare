import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Car, Users, CheckCircle, XCircle, Clock, Star, MapPin, Calendar,
  ChevronRight, Plus, AlertCircle, TrendingUp, User, Truck, Route,
  IndianRupee, Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { driverApi, bookingApi, rideApi } from '../api/index.js';
import { Spinner, EmptyState, StatusBadge, RideTypeBadge, formatCurrency, formatDate } from '../components/ui.jsx';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-primary-600 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, color, badge }) {
  return (
    <Link
      to={to}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-3 hover:shadow-md hover:border-primary-200 transition-all group text-center relative"
    >
      {badge > 0 && (
        <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={22} className="text-white" />
      </div>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </Link>
  );
}

export default function DriverDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [upcomingRides, setUpcomingRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, reqRes, ridesRes] = await Promise.all([
        driverApi.getStats(),
        bookingApi.allRequests({ status: 'pending' }),
        rideApi.myRides({ status: 'published' }),
      ]);
      setStats(statsRes.data?.stats || statsRes.data || {});
      setPendingRequests(reqRes.data?.bookings || reqRes.data || []);
      setUpcomingRides(ridesRes.data?.rides || ridesRes.data || []);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (bookingId, action) => {
    setActionLoading(prev => ({ ...prev, [bookingId]: action }));
    try {
      await bookingApi.action(bookingId, action);
      await fetchData();
    } catch {
      setError(`Failed to ${action} booking.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: null }));
    }
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Driver';
  const rating = stats?.rating != null && Number.isFinite(Number(stats.rating))
    ? Number(stats.rating).toFixed(1) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {firstName}! 🚗
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your rides today.</p>
        </div>
        <Link to="/rides/create" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} /> Create Ride
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Rides" value={stats?.total_rides ?? 0} color="bg-blue-500" />
        <StatCard icon={Calendar}   label="Upcoming"    value={stats?.upcoming_rides ?? 0}   color="bg-indigo-500" />
        <StatCard icon={CheckCircle} label="Completed"  value={stats?.completed_rides ?? 0}  color="bg-green-500" />
        <StatCard icon={XCircle}    label="Cancelled"   value={stats?.cancelled_rides ?? 0}  color="bg-red-400" />
        <StatCard icon={Clock}      label="Pending Requests" value={stats?.pending_requests ?? 0} color="bg-yellow-500" />
        <StatCard icon={Users}      label="Passengers Served" value={stats?.confirmed_passengers ?? 0} color="bg-cyan-500" />
        <StatCard icon={Car}        label="Vehicles"    value={stats?.vehicles ?? 0}          color="bg-violet-500" />
        <StatCard
          icon={Star}
          label="Avg Rating"
          value={rating ?? '—'}
          color="bg-amber-500"
          sub={rating ? `${stats?.total_reviews ?? 0} reviews` : undefined}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <QuickAction to="/rides/create"       icon={Plus}        label="Create Ride"    color="bg-primary-500" />
          <QuickAction to="/rides/my"           icon={Car}         label="My Rides"       color="bg-indigo-500" />
          <QuickAction to="/booking-requests"   icon={Bell}        label="Requests"       color="bg-yellow-500" badge={stats?.pending_requests} />
          <QuickAction to="/vehicles"           icon={Truck}       label="My Vehicles"    color="bg-violet-500" />
          <QuickAction to="/saved-routes"       icon={Route}       label="Saved Routes"   color="bg-teal-500" />
          <QuickAction to="/payments"           icon={IndianRupee} label="Payments"       color="bg-green-500" />
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Pending Requests */}
        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              Pending Booking Requests
              {pendingRequests.length > 0 && (
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </h2>
            <Link to="/booking-requests" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {pendingRequests.length === 0 ? (
            <EmptyState icon={Users} title="No pending requests" description="New booking requests will appear here." />
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map(req => {
                const id = req.id || req._id;
                const al = actionLoading[id];
                return (
                  <div key={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Passenger */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                          {req.passenger?.full_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{req.passenger?.full_name || 'Passenger'}</p>
                          {req.passenger?.gender && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${req.passenger.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                              {req.passenger.gender}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ride Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 flex items-center gap-1 truncate">
                          <MapPin size={12} className="text-primary-500 shrink-0" />
                          {req.ride?.origin?.name || 'N/A'} → {req.ride?.destination?.name || 'N/A'}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                          {req.ride?.departure_time && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> {formatDate(req.ride.departure_time)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users size={11} /> {req.seats_booked} seat{req.seats_booked !== 1 ? 's' : ''}
                          </span>
                          {req.total_amount != null && (
                            <span className="font-medium text-gray-700">{formatCurrency(req.total_amount)}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleAction(id, 'confirm')}
                          disabled={!!al}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          {al === 'confirm' ? <Spinner size="sm" /> : <CheckCircle size={13} />}
                          Confirm
                        </button>
                        <button
                          onClick={() => handleAction(id, 'reject')}
                          disabled={!!al}
                          className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          {al === 'reject' ? <Spinner size="sm" /> : <XCircle size={13} />}
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Rides */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Rides</h2>
            <Link to="/rides/my" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {upcomingRides.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No upcoming rides"
              description="Create a ride to get started!"
              action={{ label: 'Create Ride', to: '/rides/create' }}
            />
          ) : (
            <div className="space-y-3">
              {upcomingRides.slice(0, 5).map(ride => {
                const id = ride.id || ride._id;
                return (
                  <Link
                    key={id}
                    to={`/rides/${id}`}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 block hover:shadow-md hover:border-primary-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1">
                        <MapPin size={13} className="text-primary-500 shrink-0" />
                        {ride.origin?.name} → {ride.destination?.name}
                      </p>
                      <div className="flex gap-1 shrink-0">
                        <StatusBadge status={ride.status} />
                        {ride.ride_type === 'women_only' && <RideTypeBadge type="women_only" />}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      {ride.departure_time && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {formatDate(ride.departure_time)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {ride.available_seats}/{ride.total_seats} seats
                      </span>
                      {ride.contribution_per_seat != null && (
                        <span className="font-medium text-gray-700">{formatCurrency(ride.contribution_per_seat)}/seat</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Driver card */}
          <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-2xl border border-primary-100 p-5 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
                {firstName[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-primary-600 font-medium">Verified Driver</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Rating</span>
                <span className="font-semibold text-amber-600 flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  {rating ?? 'No reviews yet'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Rides</span>
                <span className="font-semibold">{stats?.total_rides ?? 0}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Passengers Served</span>
                <span className="font-semibold">{stats?.confirmed_passengers ?? 0}</span>
              </div>
            </div>
            <Link to="/profile" className="mt-4 btn-secondary w-full text-sm text-center block">
              Edit Profile
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
