import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { LocationSearch } from '../components/LocationSearch.jsx';
import { rideApi } from '../api/index.js';
import RideCard from '../components/RideCard.jsx';
import { LoadingPage, EmptyState, Alert } from '../components/ui.jsx';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';

export default function FindRides() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [origin, setOrigin] = useState(searchParams.get('origin') ? { address: searchParams.get('origin'), shortName: searchParams.get('origin') } : null);
  const [destination, setDestination] = useState(searchParams.get('destination') ? { address: searchParams.get('destination'), shortName: searchParams.get('destination') } : null);
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ min_seats: '', max_price: '', sort: 'time_asc', ac: '' });

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!origin || !destination || !date) {
      setError('Please enter origin, destination, and date.');
      return;
    }
    setError('');
    setLoading(true);
    setSearched(true);
    try {
      const res = await rideApi.search({
        origin: origin.shortName || origin.address,
        destination: destination.shortName || destination.address,
        date,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
      });
      setRides(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('origin') && searchParams.get('destination') && searchParams.get('date')) {
      handleSearch();
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Find a Ride</h1>

      {/* Search form */}
      <form onSubmit={handleSearch} className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">From</label>
            <LocationSearch placeholder="Origin" value={origin} onSelect={setOrigin} />
          </div>
          <div>
            <label className="label">To</label>
            <LocationSearch placeholder="Destination" value={destination} onSelect={setDestination} />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} className="input" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Search size={16} /> Search
            </button>
            <button type="button" onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-1 px-3">
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="label">Min Seats</label>
              <input type="number" min="1" max="8" value={filters.min_seats}
                onChange={e => setFilters({ ...filters, min_seats: e.target.value })} className="input" placeholder="Any" />
            </div>
            <div>
              <label className="label">Max Price (₹)</label>
              <input type="number" min="0" value={filters.max_price}
                onChange={e => setFilters({ ...filters, max_price: e.target.value })} className="input" placeholder="Any" />
            </div>
            <div>
              <label className="label">AC</label>
              <select className="input" value={filters.ac} onChange={e => setFilters({ ...filters, ac: e.target.value })}>
                <option value="">Any</option>
                <option value="true">AC only</option>
              </select>
            </div>
            <div>
              <label className="label">Sort by</label>
              <select className="input" value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}>
                <option value="time_asc">Earliest first</option>
                <option value="time_desc">Latest first</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        )}
      </form>

      {error && <Alert type="error" message={error} />}

      {loading && <LoadingPage />}

      {!loading && searched && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {rides.length === 0 ? 'No rides found' : `${rides.length} ride${rides.length > 1 ? 's' : ''} found`}
            </p>
            {rides.length > 0 && (
              <p className="text-xs text-gray-400">
                {origin?.shortName || origin?.address} → {destination?.shortName || destination?.address}
              </p>
            )}
          </div>

          {rides.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No rides found"
              description="Try different dates, locations, or broaden your search."
              action={<Link to="/rides/women-only" className="btn-secondary inline-block">Browse Women-Only Rides</Link>}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rides.map(ride => <RideCard key={ride.id} ride={ride} />)}
            </div>
          )}
        </>
      )}

      {!loading && !searched && (
        <div className="text-center py-16 text-gray-400">
          <Search size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-gray-500">Search for available rides</p>
          <p className="text-sm mt-1">Enter your origin, destination, and travel date above.</p>
        </div>
      )}
    </div>
  );
}
