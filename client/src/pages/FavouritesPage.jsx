import { useState, useEffect } from 'react';
import { userApi } from '../api/index.js';
import { EmptyState, LoadingPage, Alert, StarRating } from '../components/ui.jsx';
import { Heart, MapPin, Trash2, Plus, X } from 'lucide-react';
import { LocationSearch } from '../components/LocationSearch.jsx';

const TABS = ['Favourite Drivers', 'Favourite Locations'];

export default function FavouritesPage() {
  const [tab, setTab] = useState(0);
  const [drivers, setDrivers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', location: null });
  const [addingLocation, setAddingLocation] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dRes, lRes] = await Promise.all([
        userApi.getFavouriteDrivers(),
        userApi.getFavouriteLocations(),
      ]);
      setDrivers(dRes.data);
      setLocations(lRes.data);
    } catch { setError('Failed to load favourites'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const removeDriver = async (driverId) => {
    try {
      await userApi.removeFavouriteDriver(driverId);
      setDrivers(d => d.filter(x => x.driver_id !== driverId));
    } catch { setError('Failed to remove'); }
  };

  const removeLocation = async (id) => {
    try {
      await userApi.removeFavouriteLocation(id);
      setLocations(l => l.filter(x => x.id !== id));
    } catch { setError('Failed to remove'); }
  };

  const addLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.location) { setError('Please select a location'); return; }
    setAddingLocation(true);
    try {
      await userApi.addFavouriteLocation({
        name: newLocation.name || newLocation.location.shortName,
        address: newLocation.location.address,
        lat: newLocation.location.lat,
        lng: newLocation.location.lng,
      });
      setShowAddLocation(false);
      setNewLocation({ name: '', location: null });
      fetchAll();
    } catch { setError('Failed to add location'); }
    finally { setAddingLocation(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Heart size={22} className="text-pink-500" /> Favourites
      </h1>

      {error && <Alert type="error" message={error} />}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === i ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <LoadingPage /> : (
        <>
          {/* Favourite Drivers */}
          {tab === 0 && (
            drivers.length === 0 ? (
              <EmptyState icon={Heart} title="No favourite drivers"
                description="Add drivers to your favourites after a great ride." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {drivers.map(d => (
                  <div key={d.id} className="card flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                        {d.profile_picture ? (
                          <img src={`http://localhost:5000${d.profile_picture}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-primary-700">{d.full_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{d.full_name}</p>
                        <StarRating rating={d.average_rating || 0} size={12} />
                        <p className="text-xs text-gray-500">{d.total_rides || 0} rides</p>
                      </div>
                    </div>
                    <button onClick={() => removeDriver(d.driver_id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Favourite Locations */}
          {tab === 1 && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowAddLocation(!showAddLocation)}
                  className="btn-primary text-sm flex items-center gap-2">
                  <Plus size={15} /> Add Location
                </button>
              </div>

              {showAddLocation && (
                <div className="card border-primary-100 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">Add Favourite Location</h3>
                    <button onClick={() => setShowAddLocation(false)}><X size={16} className="text-gray-400" /></button>
                  </div>
                  <form onSubmit={addLocation} className="space-y-3">
                    <div>
                      <label className="label">Label (optional)</label>
                      <input type="text" className="input" placeholder="e.g. Home, Office, Gym"
                        value={newLocation.name} onChange={e => setNewLocation(l => ({ ...l, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Location *</label>
                      <LocationSearch placeholder="Search location..." value={newLocation.location}
                        onSelect={loc => setNewLocation(l => ({ ...l, location: loc }))} />
                    </div>
                    <button type="submit" disabled={addingLocation} className="btn-primary text-sm w-full">
                      {addingLocation ? 'Saving...' : 'Save Location'}
                    </button>
                  </form>
                </div>
              )}

              {locations.length === 0 ? (
                <EmptyState icon={MapPin} title="No saved locations"
                  description="Save frequently visited places for quick access." />
              ) : (
                <div className="space-y-3">
                  {locations.map(loc => (
                    <div key={loc.id} className="card flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <MapPin size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{loc.name || 'Saved Location'}</p>
                          <p className="text-xs text-gray-500 truncate max-w-56">{loc.address}</p>
                        </div>
                      </div>
                      <button onClick={() => removeLocation(loc.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
