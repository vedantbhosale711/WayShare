import { useState, useEffect } from 'react';
import { rideApi } from '../api/index.js';
import { Alert, EmptyState, LoadingPage } from '../components/ui.jsx';
import { LocationSearch } from '../components/LocationSearch.jsx';
import { MapPin, Trash2, Plus, X, Route } from 'lucide-react';

export default function SavedRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', origin: null, destination: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRoutes = async () => {
    try {
      const res = await rideApi.getSavedRoutes();
      setRoutes(res.data);
    } catch { setError('Failed to load routes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRoutes(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.origin || !form.destination) { setError('Please select both origin and destination'); return; }
    setSaving(true); setError('');
    try {
      await rideApi.saveRoute({
        name: form.name || `${form.origin.shortName} → ${form.destination.shortName}`,
        origin_address: form.origin.address,
        origin_lat: form.origin.lat,
        origin_lng: form.origin.lng,
        destination_address: form.destination.address,
        destination_lat: form.destination.lat,
        destination_lng: form.destination.lng,
      });
      setSuccess('Route saved!');
      setForm({ name: '', origin: null, destination: null });
      setShowForm(false);
      fetchRoutes();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this route?')) return;
    try {
      await rideApi.deleteSavedRoute(id);
      setRoutes(r => r.filter(x => x.id !== id));
    } catch { setError('Delete failed'); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Route size={22} className="text-primary-600" /> Saved Routes
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={15} /> Save Route
        </button>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {showForm && (
        <div className="card border-primary-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Save New Route</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="label">Route Name (optional)</label>
              <input type="text" className="input" placeholder="e.g. Daily Commute"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">From *</label>
              <LocationSearch placeholder="Origin" value={form.origin} onSelect={o => setForm(f => ({ ...f, origin: o }))} />
            </div>
            <div>
              <label className="label">To *</label>
              <LocationSearch placeholder="Destination" value={form.destination} onSelect={d => setForm(f => ({ ...f, destination: d }))} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full text-sm">
              {saving ? 'Saving...' : 'Save Route'}
            </button>
          </form>
        </div>
      )}

      {loading ? <LoadingPage /> : routes.length === 0 ? (
        <EmptyState icon={Route} title="No saved routes"
          description="Save your frequently travelled routes for quick ride searches." />
      ) : (
        <div className="space-y-3">
          {routes.map(r => (
            <div key={r.id} className="card flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Route size={18} className="text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800">{r.name || 'Saved Route'}</p>
                  <div className="flex items-start gap-1 text-xs text-gray-500 mt-0.5">
                    <MapPin size={10} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="truncate">{r.origin_address}</span>
                  </div>
                  <div className="flex items-start gap-1 text-xs text-gray-500">
                    <MapPin size={10} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="truncate">{r.destination_address}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(r.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
