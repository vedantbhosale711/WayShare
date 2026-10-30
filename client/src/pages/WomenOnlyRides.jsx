import { useState } from 'react';
import { Search, SlidersHorizontal, Heart, Shield, Star, Filter } from 'lucide-react';
import { rideApi } from '../api/index.js';
import { Spinner, EmptyState, Alert, formatDate, formatCurrency } from '../components/ui.jsx';
import RideCard from '../components/RideCard.jsx';
import { LocationSearch } from '../components/LocationSearch.jsx';

export default function WomenOnlyRides() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [date, setDate] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSeats, setMinSeats] = useState('');
  const [sort, setSort] = useState('time_asc');
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const params = {
        origin_address: origin?.address,
        destination_address: destination?.address,
        date: date || undefined,
        max_price: maxPrice || undefined,
        min_seats: minSeats || undefined,
        sort: sort,
      };
      const res = await rideApi.womenOnly(params);
      setRides(res.data?.rides || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load women-only rides.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-pink-600 via-pink-500 to-rose-400 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-20 w-60 h-60 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-14 text-center">
          <div className="text-5xl mb-4">🌸</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Women-Only Rides</h1>
          <p className="text-lg text-pink-100 font-medium mb-2">Safe. Comfortable. Trusted.</p>
          <p className="text-pink-200 text-sm max-w-xl mx-auto">
            Travel with confidence. These rides are exclusively offered by female drivers for female passengers.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-pink-100">
            <div className="flex items-center gap-1.5"><Shield size={16} /><span>Verified drivers</span></div>
            <div className="flex items-center gap-1.5"><Heart size={16} /><span>Female-only</span></div>
            <div className="flex items-center gap-1.5"><Star size={16} /><span>Rated & reviewed</span></div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-pink-50 border-y border-pink-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-start gap-3">
          <span className="text-pink-500 mt-0.5 flex-shrink-0">ℹ️</span>
          <p className="text-sm text-pink-800">
            <strong>Eligibility notice:</strong> These rides are exclusively for female passengers. Eligibility is based on declared profile gender. Please ensure your profile reflects accurate information.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search form */}
        <form onSubmit={handleSearch} className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Search size={18} className="text-pink-500" /> Find Women-Only Rides
            </h2>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
              <SlidersHorizontal size={16} /> Filters {showFilters ? '▲' : '▼'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">From</label>
              <LocationSearch placeholder="Origin city or address" value={origin} onSelect={setOrigin} />
            </div>
            <div>
              <label className="label">To</label>
              <LocationSearch placeholder="Destination city or address" value={destination} onSelect={setDestination} />
            </div>
          </div>
          <div className="mb-4">
            <label className="label">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} className="input w-full sm:w-48" />
          </div>
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-100">
              <div>
                <label className="label">Max Price (₹)</label>
                <input type="number" min="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="e.g. 500" className="input" />
              </div>
              <div>
                <label className="label">Min Seats</label>
                <input type="number" min="1" max="8" value={minSeats} onChange={e => setMinSeats(e.target.value)} placeholder="e.g. 2" className="input" />
              </div>
              <div>
                <label className="label">Sort By</label>
                <select value={sort} onChange={e => setSort(e.target.value)} className="input">
                  <option value="time_asc">Departure: Earliest</option>
                  <option value="price_asc">Price: Low to High</option>
                </select>
              </div>
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" /> : <Search size={16} />}
            {loading ? 'Searching...' : 'Search Rides'}
          </button>
        </form>

        {error && <Alert type="error" message={error} />}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-3 text-gray-500 text-sm">Finding women-only rides...</p>
            </div>
          </div>
        )}

        {!loading && searched && rides.length === 0 && (
          <EmptyState
            icon={Heart}
            title="No women-only rides found"
            description="Try adjusting your filters or search on a different date."
            action={
              <button onClick={() => { setOrigin(null); setDestination(null); setDate(''); setMaxPrice(''); setMinSeats(''); }} className="btn-secondary text-sm">
                Clear Filters
              </button>
            }
          />
        )}

        {!loading && rides.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Showing <span className="font-semibold text-gray-900">{rides.length}</span> women-only ride{rides.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rides.map(ride => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          </div>
        )}

        {!searched && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌸</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Find Your Safe Ride</h3>
            <p className="text-gray-500 text-sm">Search for women-only rides using the form above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
