import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, Plus, Trash2, ChevronRight, ChevronLeft, Car,
  CheckCircle, Zap, Wind, Cigarette, PawPrint, Music,
  Utensils, Armchair, Navigation, Save,
} from 'lucide-react';
import { rideApi, vehicleApi } from '../api/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Spinner, LoadingPage, Alert, formatCurrency, formatDistance, formatDuration } from '../components/ui.jsx';
import RouteMap from '../components/RouteMap.jsx';
import { LocationSearch, fetchRoute } from '../components/LocationSearch.jsx';

const STEPS = ['Route', 'Ride Details', 'Preferences', 'Review & Update'];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${i < current ? 'bg-primary-600 border-primary-600 text-white' : i === current ? 'border-primary-600 text-primary-600 bg-white' : 'border-gray-300 text-gray-400 bg-white'}`}>
              {i < current ? <CheckCircle size={18} /> : i + 1}
            </div>
            <span className={`text-xs mt-1 font-medium hidden sm:block ${i === current ? 'text-primary-600' : 'text-gray-400'}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`w-12 sm:w-20 h-0.5 mx-1 ${i < current ? 'bg-primary-600' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );
}

function Toggle({ value, onChange, label, icon: Icon, description }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        {Icon && <Icon size={18} className="text-gray-500" />}
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      <button type="button" onClick={() => onChange(!value)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-primary-600' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

export default function EditRide() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [form, setForm] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [fetchingRoute, setFetchingRoute] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [rideRes, vehicleRes] = await Promise.all([rideApi.get(id), vehicleApi.list()]);
        const ride = rideRes.data;
        setVehicles(vehicleRes.data?.vehicles || vehicleRes.data || []);

        let parsedStops = [];
        try { parsedStops = ride.stops ? JSON.parse(ride.stops) : []; } catch { parsedStops = []; }

        let parsedRoute = [];
        try { parsedRoute = ride.route_polyline ? JSON.parse(ride.route_polyline) : []; } catch { parsedRoute = []; }

        setForm({
          origin: ride.origin_address ? { address: ride.origin_address, lat: parseFloat(ride.origin_lat), lng: parseFloat(ride.origin_lng) } : null,
          stops: parsedStops,
          destination: ride.destination_address ? { address: ride.destination_address, lat: parseFloat(ride.destination_lat), lng: parseFloat(ride.destination_lng) } : null,
          routeCoords: parsedRoute,
          estimated_distance_km: ride.estimated_distance_km,
          estimated_duration_min: ride.estimated_duration_min,
          departure_datetime: ride.departure_datetime ? ride.departure_datetime.slice(0, 16) : '',
          vehicle_id: String(ride.vehicle_id || ''),
          available_seats: ride.available_seats || 1,
          contribution_per_seat: ride.contribution_per_seat || '',
          toll_charges: ride.toll_charges || '',
          booking_type: ride.booking_type || 'auto',
          ride_type: ride.ride_type || 'regular',
          cancellation_hours: ride.cancellation_hours || 2,
          additional_instructions: ride.additional_instructions || '',
          ac: ride.ac ?? true,
          smoking_allowed: ride.smoking_allowed ?? false,
          pets_allowed: ride.pets_allowed ?? false,
          food_allowed: ride.food_allowed ?? true,
          music_allowed: ride.music_allowed ?? true,
          luggage_size: ride.luggage_size || 'small',
          front_seat_available: ride.front_seat_available ?? false,
        });
      } catch (err) {
        setPageError(err.response?.data?.message || 'Failed to load ride.');
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const updateStop = (idx, val) => {
    const s = [...form.stops];
    s[idx] = val;
    setForm(f => ({ ...f, stops: s }));
  };

  const addStop = () => { if (form.stops.length < 3) setForm(f => ({ ...f, stops: [...f.stops, null] })); };
  const removeStop = (idx) => { const s = form.stops.filter((_, i) => i !== idx); setForm(f => ({ ...f, stops: s })); };

  const recalcRoute = useCallback(async (origin, stops, destination) => {
    const waypoints = [origin, ...stops.filter(Boolean), destination].filter(Boolean);
    if (waypoints.length < 2) return;
    setFetchingRoute(true);
    const result = await fetchRoute(waypoints);
    if (result) setForm(f => ({ ...f, routeCoords: result.coords, estimated_distance_km: result.distance_km, estimated_duration_min: result.duration_min }));
    setFetchingRoute(false);
  }, []);

  const handleOriginSelect = async (loc) => {
    setForm(f => ({ ...f, origin: loc }));
    if (loc && form.destination) await recalcRoute(loc, form.stops, form.destination);
  };

  const handleDestinationSelect = async (loc) => {
    setForm(f => ({ ...f, destination: loc }));
    if (form.origin && loc) await recalcRoute(form.origin, form.stops, loc);
  };

  const validateStep = () => {
    setError('');
    if (step === 0) {
      if (!form.origin) return setError('Please select an origin.') || false;
      if (!form.destination) return setError('Please select a destination.') || false;
    }
    if (step === 1) {
      if (!form.departure_datetime) return setError('Please select departure date and time.') || false;
      if (!form.vehicle_id) return setError('Please select a vehicle.') || false;
      if (!form.contribution_per_seat) return setError('Please enter contribution per seat.') || false;
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        origin_address: form.origin?.address,
        origin_lat: form.origin?.lat,
        origin_lng: form.origin?.lng,
        destination_address: form.destination?.address,
        destination_lat: form.destination?.lat,
        destination_lng: form.destination?.lng,
        stops: form.stops.filter(Boolean).map(s => ({ address: s.address, lat: s.lat, lng: s.lng })),
        departure_datetime: form.departure_datetime,
        vehicle_id: parseInt(form.vehicle_id),
        available_seats: parseInt(form.available_seats),
        contribution_per_seat: parseFloat(form.contribution_per_seat),
        toll_charges: form.toll_charges ? parseFloat(form.toll_charges) : 0,
        booking_type: form.booking_type,
        ride_type: form.ride_type,
        cancellation_hours: parseInt(form.cancellation_hours),
        additional_instructions: form.additional_instructions,
        ac: form.ac,
        smoking_allowed: form.smoking_allowed,
        pets_allowed: form.pets_allowed,
        food_allowed: form.food_allowed,
        music_allowed: form.music_allowed,
        luggage_size: form.luggage_size,
        front_seat_available: form.front_seat_available,
        estimated_distance_km: form.estimated_distance_km ? parseFloat(form.estimated_distance_km) : null,
        estimated_duration_min: form.estimated_duration_min ? parseInt(form.estimated_duration_min) : null,
        route_polyline: form.routeCoords.length ? JSON.stringify(form.routeCoords) : null,
      };
      await rideApi.update(id, payload);
      navigate('/driver/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ride.');
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) return <LoadingPage />;
  if (pageError) return <div className="max-w-2xl mx-auto px-4 py-10"><Alert type="error" message={pageError} /></div>;
  if (!form) return null;

  const selectedVehicle = vehicles.find(v => v.id === parseInt(form.vehicle_id));
  const todayStr = new Date().toISOString().slice(0, 16);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Ride</h1>
      <p className="text-gray-500 mb-6">Update your ride details below.</p>
      <StepIndicator current={step} />
      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {/* STEP 0: Route */}
      {step === 0 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Navigation size={20} className="text-primary-600" /> Route</h2>
          <div>
            <label className="label">Origin</label>
            <LocationSearch placeholder="Origin" value={form.origin} onSelect={handleOriginSelect} />
          </div>
          {form.stops.map((stop, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <label className="label">Stop {idx + 1}</label>
                <button type="button" onClick={() => removeStop(idx)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"><Trash2 size={12} /> Remove</button>
              </div>
              <LocationSearch placeholder={`Stop ${idx + 1}`} value={stop} onSelect={loc => updateStop(idx, loc)} />
            </div>
          ))}
          {form.stops.length < 3 && (
            <button type="button" onClick={addStop} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 font-medium"><Plus size={16} /> Add Stop</button>
          )}
          <div>
            <label className="label">Destination</label>
            <LocationSearch placeholder="Destination" value={form.destination} onSelect={handleDestinationSelect} />
          </div>
          {form.origin && form.destination && (
            <button type="button" onClick={() => recalcRoute(form.origin, form.stops, form.destination)} disabled={fetchingRoute} className="btn-secondary flex items-center gap-2 text-sm">
              {fetchingRoute ? <Spinner size="sm" /> : <Navigation size={16} />} {fetchingRoute ? 'Recalculating...' : 'Recalculate Route'}
            </button>
          )}
          {form.origin && (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <RouteMap origin={form.origin} destination={form.destination} stops={form.stops.filter(Boolean)} routeCoords={form.routeCoords} height="280px" />
            </div>
          )}
          {form.estimated_distance_km && (
            <div className="flex gap-4 bg-primary-50 rounded-lg p-3">
              <div className="text-center flex-1"><p className="text-xs text-gray-500">Distance</p><p className="font-bold text-primary-700">{formatDistance(form.estimated_distance_km)}</p></div>
              <div className="text-center flex-1"><p className="text-xs text-gray-500">Duration</p><p className="font-bold text-primary-700">{formatDuration(form.estimated_duration_min)}</p></div>
            </div>
          )}
        </div>
      )}

      {/* STEP 1: Details */}
      {step === 1 && (
        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Car size={20} className="text-primary-600" /> Ride Details</h2>
          <div>
            <label className="label">Departure Date & Time</label>
            <input type="datetime-local" min={todayStr} value={form.departure_datetime} onChange={e => set('departure_datetime', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Vehicle</label>
            {vehicles.length === 0 ? (
              <p className="text-sm text-gray-500">No vehicles available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.map(v => (
                  <label key={v.id} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${form.vehicle_id === String(v.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                    <input type="radio" name="vehicle" value={v.id} checked={form.vehicle_id === String(v.id)} onChange={e => set('vehicle_id', e.target.value)} className="sr-only" />
                    <div className="w-14 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {v.image ? <img src={`http://localhost:5000${v.image}`} alt="" className="w-full h-full object-cover" /> : <Car size={20} className="text-gray-400" />}
                    </div>
                    <div><p className="text-sm font-semibold">{v.make} {v.model}</p><p className="text-xs text-gray-500">{v.registration_number} · {v.total_seats} seats</p></div>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Available Seats</label>
              <input type="number" min="1" max={selectedVehicle?.total_seats || 8} value={form.available_seats} onChange={e => set('available_seats', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Contribution per Seat (₹)</label>
              <input type="number" min="0" value={form.contribution_per_seat} onChange={e => set('contribution_per_seat', e.target.value)} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Toll Charges (₹)</label>
            <input type="number" min="0" value={form.toll_charges} onChange={e => set('toll_charges', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Booking Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ val: 'auto', icon: Zap, label: 'Auto / Instant' }, { val: 'manual', icon: CheckCircle, label: 'Manual Approval' }].map(({ val, icon: Icon, label }) => (
                <label key={val} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer ${form.booking_type === val ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                  <input type="radio" name="booking_type" value={val} checked={form.booking_type === val} onChange={e => set('booking_type', e.target.value)} className="sr-only" />
                  <Icon size={18} className={form.booking_type === val ? 'text-primary-600' : 'text-gray-400'} />
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Ride Type</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer ${form.ride_type === 'regular' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                <input type="radio" name="ride_type" value="regular" checked={form.ride_type === 'regular'} onChange={e => set('ride_type', e.target.value)} className="sr-only" />
                <span className="text-xl">🚗</span><p className="text-sm font-medium text-gray-900">Regular</p>
              </label>
              {user?.gender === 'female' && (
                <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer ${form.ride_type === 'women_only' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>
                  <input type="radio" name="ride_type" value="women_only" checked={form.ride_type === 'women_only'} onChange={e => set('ride_type', e.target.value)} className="sr-only" />
                  <span className="text-xl">👩</span><p className="text-sm font-medium text-gray-900">Women-Only</p>
                </label>
              )}
            </div>
          </div>
          <div>
            <label className="label">Cancellation Window (hours)</label>
            <input type="number" min="0" max="72" value={form.cancellation_hours} onChange={e => set('cancellation_hours', e.target.value)} className="input w-32" />
          </div>
          <div>
            <label className="label">Additional Instructions</label>
            <textarea rows={3} value={form.additional_instructions} onChange={e => set('additional_instructions', e.target.value)} className="input resize-none" />
          </div>
        </div>
      )}

      {/* STEP 2: Preferences */}
      {step === 2 && (
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Ride Preferences</h2>
          <Toggle value={form.ac} onChange={v => set('ac', v)} label="Air Conditioning" icon={Wind} />
          <Toggle value={form.smoking_allowed} onChange={v => set('smoking_allowed', v)} label="Smoking Allowed" icon={Cigarette} />
          <Toggle value={form.pets_allowed} onChange={v => set('pets_allowed', v)} label="Pets Allowed" icon={PawPrint} />
          <Toggle value={form.food_allowed} onChange={v => set('food_allowed', v)} label="Food Allowed" icon={Utensils} />
          <Toggle value={form.music_allowed} onChange={v => set('music_allowed', v)} label="Music Allowed" icon={Music} />
          <Toggle value={form.front_seat_available} onChange={v => set('front_seat_available', v)} label="Front Seat Available" icon={Armchair} />
          <div>
            <label className="label">Luggage Size</label>
            <select value={form.luggage_size} onChange={e => set('luggage_size', e.target.value)} className="input">
              <option value="small">Small</option>
              <option value="large">Large</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>
      )}

      {/* STEP 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Changes</h2>
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Route</p>
              <div className="space-y-1">
                <div className="flex items-start gap-2"><div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" /><p className="text-sm">{form.origin?.address}</p></div>
                {form.stops.filter(Boolean).map((s, i) => <div key={i} className="flex items-start gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" /><p className="text-sm">{s?.address}</p></div>)}
                <div className="flex items-start gap-2"><div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" /><p className="text-sm">{form.destination?.address}</p></div>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-200 mb-4">
              <RouteMap origin={form.origin} destination={form.destination} stops={form.stops.filter(Boolean)} routeCoords={form.routeCoords} height="200px" interactive={false} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Departure</p><p className="text-sm font-semibold">{form.departure_datetime ? new Date(form.departure_datetime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Seats</p><p className="text-sm font-semibold">{form.available_seats}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Contribution</p><p className="text-sm font-semibold text-primary-700">{formatCurrency(form.contribution_per_seat)}/seat</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.ac && <span className="badge badge-blue">❄ AC</span>}
              {form.smoking_allowed && <span className="badge badge-yellow">🚬 Smoking</span>}
              {form.pets_allowed && <span className="badge badge-green">🐾 Pets</span>}
              {form.food_allowed && <span className="badge badge-green">🍕 Food</span>}
              {form.music_allowed && <span className="badge badge-blue">🎵 Music</span>}
              {form.front_seat_available && <span className="badge badge-gray">💺 Front Seat</span>}
            </div>
          </div>
          {error && <Alert type="error" message={error} />}
          <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting ? <Spinner size="sm" /> : <Save size={18} />} Update Ride
          </button>
        </div>
      )}

      {step < 3 && (
        <div className="flex justify-between mt-6">
          {step > 0 ? <button type="button" onClick={prevStep} className="btn-secondary flex items-center gap-2"><ChevronLeft size={18} /> Back</button> : <div />}
          <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2">{step === 2 ? 'Review Changes' : 'Continue'} <ChevronRight size={18} /></button>
        </div>
      )}
      {step === 3 && <div className="mt-4"><button type="button" onClick={prevStep} className="btn-secondary flex items-center gap-2"><ChevronLeft size={18} /> Back</button></div>}
    </div>
  );
}
