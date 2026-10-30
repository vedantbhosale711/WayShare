import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car, Plus, MapPin, Calendar, Users, Edit2, Trash2,
  Copy, Eye, AlertCircle, CheckCircle, X, Filter,
  IndianRupee, Clock, ChevronDown
} from 'lucide-react';
import { rideApi } from '../api/index.js';
import { Spinner, EmptyState, StatusBadge, RideTypeBadge, formatCurrency, formatDate } from '../components/ui.jsx';

const TABS = [
  { key: 'all',       label: 'All Rides' },
  { key: 'published', label: 'Published' },
  { key: 'draft',     label: 'Drafts' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function CancelDialog({ ride, onConfirm, onCancel, cancelling }) {
  if (!ride) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel This Ride?</h3>
        <p className="text-sm text-gray-500 mb-1">
          <strong>{ride.origin?.name}</strong> → <strong>{ride.destination?.name}</strong>
        </p>
        <p className="text-sm text-gray-400 mb-6">All confirmed passengers will be notified of the cancellation.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Keep Ride</button>
          <button
            onClick={onConfirm}
            disabled={cancelling}
            className="btn-danger flex-1 flex items-center justify-center gap-2"
          >
            {cancelling ? <Spinner size="sm" /> : null}
            {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RideCard({ ride, onCancel, onDuplicate, duplicating }) {
  const id = ride.id || ride._id;
  const canEdit = ['published', 'draft'].includes(ride.status);
  const canCancel = !['cancelled', 'completed'].includes(ride.status);
  const passengers = ride.confirmed_passengers_count ?? ride.bookings_count ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={15} className="text-primary-500 shrink-0" />
              <span className="font-semibold text-gray-900 truncate">
                {ride.origin?.name} → {ride.destination?.name}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {ride.departure_time && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {formatDate(ride.departure_time)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users size={11} /> {ride.available_seats}/{ride.total_seats} seats
              </span>
              {ride.contribution_per_seat != null && (
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <IndianRupee size={11} /> {formatCurrency(ride.contribution_per_seat)}/seat
                </span>
              )}
              {passengers > 0 && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <Users size={11} /> {passengers} confirmed
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <StatusBadge status={ride.status} />
            {ride.ride_type === 'women_only' && <RideTypeBadge type="women_only" />}
          </div>
        </div>

        {/* Vehicle */}
        {ride.vehicle && (
          <div className="text-xs text-gray-400 flex items-center gap-1 mb-3">
            <Car size={11} />
            {ride.vehicle.make} {ride.vehicle.model} · {ride.vehicle.registration_number}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 px-5 pb-4 pt-0 border-t border-gray-50">
        <Link to={`/rides/${id}`} className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3">
          <Eye size={13} /> View
        </Link>
        {canEdit && (
          <Link to={`/rides/${id}/edit`} className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3">
            <Edit2 size={13} /> Edit
          </Link>
        )}
        <button
          onClick={() => onDuplicate(ride)}
          disabled={duplicating}
          className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
        >
          {duplicating ? <Spinner size="sm" /> : <Copy size={13} />}
          Duplicate
        </button>
        {canCancel && (
          <button
            onClick={() => onCancel(ride)}
            className="btn-danger flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <Trash2 size={13} /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyRides() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [duplicating, setDuplicating] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRides = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await rideApi.myRides(params);
      setRides(res.data?.rides || res.data || []);
    } catch {
      setError('Failed to load rides.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const id = cancelTarget.id || cancelTarget._id;
      await rideApi.cancel(id);
      setSuccess('Ride cancelled successfully.');
      setCancelTarget(null);
      fetchRides();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel ride.');
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  };

  const handleDuplicate = async (ride) => {
    const id = ride.id || ride._id;
    setDuplicating(prev => ({ ...prev, [id]: true }));
    try {
      const res = await rideApi.duplicate(id);
      const newId = res.data?.ride?.id || res.data?.ride?._id || res.data?.id;
      if (newId) navigate(`/rides/${newId}/edit`);
      else fetchRides();
    } catch {
      setError('Failed to duplicate ride.');
    } finally {
      setDuplicating(prev => ({ ...prev, [id]: false }));
    }
  };

  const counts = {
    all: rides.length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Rides</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all rides you've posted.</p>
        </div>
        <Link to="/rides/create" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} /> Create Ride
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : rides.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No rides found"
          description={activeTab === 'all' ? "You haven't created any rides yet." : `No ${activeTab} rides.`}
          action={{ label: 'Create a Ride', to: '/rides/create' }}
        />
      ) : (
        <div className="space-y-4">
          {rides.map(ride => {
            const id = ride.id || ride._id;
            return (
              <RideCard
                key={id}
                ride={ride}
                onCancel={setCancelTarget}
                onDuplicate={handleDuplicate}
                duplicating={!!duplicating[id]}
              />
            );
          })}
        </div>
      )}

      <CancelDialog
        ride={cancelTarget}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        cancelling={cancelling}
      />
    </div>
  );
}
