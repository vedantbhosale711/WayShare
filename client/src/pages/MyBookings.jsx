import { useState, useEffect } from 'react';
import { bookingApi } from '../api/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LoadingPage, EmptyState, StatusBadge, RideTypeBadge, formatDate, formatCurrency, Alert } from '../components/ui.jsx';
import { Link } from 'react-router-dom';
import { MapPin, Car, Users, CalendarDays, ChevronRight } from 'lucide-react';

const TABS = ['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'];

export default function MyBookings() {
  const { user } = useAuth();
  const [tab, setTab] = useState('All');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = tab === 'All' ? {} : { status: tab.toLowerCase() };
      const res = await bookingApi.myBookings(params);
      setBookings(res.data);
    } catch { setError('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [tab]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {error && <Alert type="error" message={error} />}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 min-w-max px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <LoadingPage /> : bookings.length === 0 ? (
        <EmptyState icon={Car} title={`No ${tab.toLowerCase() === 'all' ? '' : tab.toLowerCase()} bookings`}
          description="Search for rides and book your next journey."
          action={<Link to="/rides/search" className="btn-primary inline-block">Find Rides</Link>} />
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <Link key={b.id} to={`/bookings/${b.id}`}
              className="card block hover:shadow-md transition-shadow group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <RideTypeBadge type={b.ride_type} />
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-800 mb-1">
                    <MapPin size={13} className="text-green-500 flex-shrink-0" />
                    <span className="truncate">{b.origin_address}</span>
                    <span className="text-gray-400 mx-1">→</span>
                    <MapPin size={13} className="text-red-500 flex-shrink-0" />
                    <span className="truncate">{b.destination_address}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><CalendarDays size={11} /> {formatDate(b.departure_datetime)}</span>
                    <span className="flex items-center gap-1"><Car size={11} /> {b.driver_name}</span>
                    <span className="flex items-center gap-1">{b.make} {b.model} · {b.registration_number}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {b.seats_booked} seat{b.seats_booked > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-primary-700 text-lg">{formatCurrency(b.total_amount)}</p>
                    <p className="text-xs text-gray-400 capitalize">{b.payment_status || 'pending'}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
