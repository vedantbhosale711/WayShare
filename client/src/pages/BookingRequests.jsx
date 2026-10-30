import { useState, useEffect, useCallback } from 'react';
import {
  Users, MapPin, Calendar, CheckCircle, XCircle, Clock,
  AlertCircle, Phone, User, IndianRupee, X, Search
} from 'lucide-react';
import { bookingApi } from '../api/index.js';
import { Spinner, EmptyState, StatusBadge, formatCurrency, formatDate } from '../components/ui.jsx';

const TABS = [
  { key: 'pending',   label: 'Pending',   icon: Clock,        color: 'text-yellow-600' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle,  color: 'text-green-600' },
  { key: 'rejected',  label: 'Rejected',  icon: XCircle,      color: 'text-red-500' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle,      color: 'text-gray-400' },
  { key: 'all',       label: 'All',       icon: null,         color: '' },
];

function PassengerCard({ booking, onAction, actionLoading }) {
  const id = booking.id || booking._id;
  const passenger = booking.passenger || {};
  const ride = booking.ride || {};
  const al = actionLoading[id];
  const isPending = booking.status === 'pending';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">

        {/* Passenger avatar + info */}
        <div className="flex items-center gap-3 sm:w-52 shrink-0">
          <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-base shrink-0">
            {passenger.full_name?.[0] || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{passenger.full_name || 'Passenger'}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {passenger.gender && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  passenger.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {passenger.gender}
                </span>
              )}
              {passenger.mobile && (
                <a href={`tel:${passenger.mobile}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600">
                  <Phone size={10} /> {passenger.mobile}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Ride details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <MapPin size={13} className="text-primary-500 shrink-0" />
            <span className="text-sm font-medium text-gray-800 truncate">
              {ride.origin?.name || 'N/A'} → {ride.destination?.name || 'N/A'}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {ride.departure_time && (
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {formatDate(ride.departure_time)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users size={11} /> {booking.seats_booked} seat{booking.seats_booked !== 1 ? 's' : ''}
            </span>
            {booking.total_amount != null && (
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <IndianRupee size={11} /> {formatCurrency(booking.total_amount)}
              </span>
            )}
            {booking.pickup_location && (
              <span className="text-primary-600">Pickup: {booking.pickup_location}</span>
            )}
          </div>
        </div>

        {/* Status + Actions */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <StatusBadge status={booking.status} />
          {isPending && (
            <div className="flex gap-2">
              <button
                onClick={() => onAction(id, 'confirm')}
                disabled={!!al}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                {al === 'confirm' ? <Spinner size="sm" /> : <CheckCircle size={13} />}
                Confirm
              </button>
              <button
                onClick={() => onAction(id, 'reject')}
                disabled={!!al}
                className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1"
              >
                {al === 'reject' ? <Spinner size="sm" /> : <XCircle size={13} />}
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingRequests() {
  const [activeTab, setActiveTab] = useState('pending');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await bookingApi.allRequests(params);
      setBookings(res.data?.bookings || res.data || []);
    } catch {
      setError('Failed to load booking requests.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAction = async (id, action) => {
    setActionLoading(prev => ({ ...prev, [id]: action }));
    setError('');
    try {
      await bookingApi.action(id, action);
      setSuccess(`Booking ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully.`);
      setTimeout(() => setSuccess(''), 3000);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} booking.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and manage passenger booking requests for your rides.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors relative ${
                isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {Icon && <Icon size={14} className={isActive ? tab.color : ''} />}
              {tab.label}
              {tab.key === 'pending' && pendingCount > 0 && activeTab !== 'pending' && (
                <span className="ml-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Users}
          title={activeTab === 'pending' ? 'No pending requests' : `No ${activeTab} bookings`}
          description={
            activeTab === 'pending'
              ? 'New booking requests from passengers will appear here.'
              : 'No bookings match this filter.'
          }
        />
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <PassengerCard
              key={booking.id || booking._id}
              booking={booking}
              onAction={handleAction}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
