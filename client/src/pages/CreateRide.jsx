import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Plus, Trash2, ChevronRight, ChevronLeft, Car,
  Calendar, Users, IndianRupee, Clock, CheckCircle, Zap,
  Wind, Cigarette, PawPrint, Music, Utensils, Luggage, Armchair,
  AlertCircle, Navigation,
} from 'lucide-react';

import { rideApi, vehicleApi } from '../api/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Spinner, Alert, formatCurrency, formatDistance, formatDuration } from '../components/ui.jsx';
import RouteMap from '../components/RouteMap.jsx';
import { LocationSearch, fetchRoute } from '../components/LocationSearch.jsx';

const STEPS = ['Route', 'Ride Details', 'Preferences', 'Review & Publish'];

const defaultForm = {
  origin: null,
  stops: [],
  destination: null,
  routeCoords: [],
  estimated_distance_km: null,
  estimated_duration_min: null,

  departure_datetime: '',
  vehicle_id: '',
  available_seats: 1,
  contribution_per_seat: '',
  toll_charges: '',
  booking_type: 'auto',
  ride_type: 'regular',
  cancellation_hours: 2,
  additional_instructions: '',

  ac: true,
  smoking_allowed: false,
  pets_allowed: false,
  food_allowed: true,
  music_allowed: true,
  luggage_size: 'small',
  front_seat_available: false,
};

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                i < current
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : i === current
                  ? 'border-primary-600 text-primary-600 bg-white'
                  : 'border-gray-300 text-gray-400 bg-white'
              }`}
            >
              {i < current ? <CheckCircle size={18} /> : i + 1}
            </div>
            <span className={`text-xs mt-1 font-medium hidden sm:block ${i === current ? 'text-primary-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-12 sm:w-20 h-0.5 mx-1 ${i < current ? 'bg-primary-600' : 'bg-gray-200'}`} />
          )}
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
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-primary-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

export default function CreateRide() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [fetchingRoute, setFetchingRoute] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const updateStop = (idx, val) => {
    const s = [...form.stops];
    s[idx] = val;
    setForm(f => ({ ...f, stops: s }));
  };

  const addStop = () => {
    if (form.stops.length < 3) {
      setForm(f => ({ ...f, stops: [...f.stops, null] }));
    }
  };

  const removeStop = (idx) => {
    const s = form.stops.filter((_, i) => i !== idx);
    setForm(f => ({ ...f, stops: s }));
  };

  const handleFetchRoute = useCallback(async () => {
    const waypoints = [
      form.origin,
      ...form.stops.filter(Boolean),
      form.destination,
    ].filter(Boolean);

    if (waypoints.length < 2) return;

    setFetchingRoute(true);
    const result = await fetchRoute(waypoints);

    if (result) {
      setForm(f => ({
        ...f,
        routeCoords: result.coords,
        estimated_distance_km: result.distance_km,
        estimated_duration_min: result.duration_min,
      }));
    }

    setFetchingRoute(false);
  }, [form.origin, form.stops, form.destination]);

  const handleOriginSelect = async (loc) => {
    setForm(f => ({ ...f, origin: loc }));

    if (loc && form.destination) {
      const waypoints = [
        loc,
        ...form.stops.filter(Boolean),
        form.destination,
      ];

      setFetchingRoute(true);
      const result = await fetchRoute(waypoints);

      if (result) {
        setForm(f => ({
          ...f,
          routeCoords: result.coords,
          estimated_distance_km: result.distance_km,
          estimated_duration_min: result.duration_min,
        }));
      }

      setFetchingRoute(false);
    }
  };

  const handleDestinationSelect = async (loc) => {
    setForm(f => ({ ...f, destination: loc }));

    if (form.origin && loc) {
      const waypoints = [
        form.origin,
        ...form.stops.filter(Boolean),
        loc,
      ];

      setFetchingRoute(true);
      const result = await fetchRoute(waypoints);

      if (result) {
        setForm(f => ({
          ...f,
          routeCoords: result.coords,
          estimated_distance_km: result.distance_km,
          estimated_duration_min: result.duration_min,
        }));
      }

      setFetchingRoute(false);
    }
  };

  const loadVehicles = async () => {
    if (vehiclesLoaded) return;

    try {
      const res = await vehicleApi.list();
      setVehicles(res.data?.vehicles || res.data || []);
      setVehiclesLoaded(true);
    } catch {
      setVehicles([]);
    }
  };

  const validateStep = () => {
    setError('');

    if (step === 0) {
      if (!form.origin) {
        return setError('Please select an origin location.') || false;
      }

      if (!form.destination) {
        return setError('Please select a destination.') || false;
      }

      return true;
    }

    if (step === 1) {
      if (!form.departure_datetime) {
        return setError('Please select departure date and time.') || false;
      }

      if (!form.vehicle_id) {
        return setError('Please select a vehicle.') || false;
      }

      if (!form.contribution_per_seat) {
        return setError('Please enter contribution per seat.') || false;
      }

      return true;
    }

    return true;
  };

  const nextStep = async () => {
    if (!validateStep()) return;

    if (step === 0) {
      await loadVehicles();
    }

    setStep(s => s + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(s => s - 1);
  };

  const handleSubmit = async (status) => {
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

        stops: form.stops
          .filter(Boolean)
          .map(s => ({
            address: s.address,
            lat: s.lat,
            lng: s.lng,
          })),

        departure_datetime: form.departure_datetime,

        // Keep the vehicle UUID as a string.
        vehicle_id: form.vehicle_id,

        // Backend field is total_seats.
        total_seats: parseInt(form.available_seats, 10),

        contribution_per_seat: parseFloat(form.contribution_per_seat),
        toll_charges: form.toll_charges
          ? parseFloat(form.toll_charges)
          : 0,

        booking_type: form.booking_type,
        ride_type: form.ride_type,
        cancellation_hours: parseInt(form.cancellation_hours, 10),
        additional_instructions: form.additional_instructions,

        preferences: {
          ac: form.ac,
          smoking_allowed: form.smoking_allowed,
          pets_allowed: form.pets_allowed,
          food_allowed: form.food_allowed,
          music_allowed: form.music_allowed,
          luggage_size: form.luggage_size,
          front_seat_available: form.front_seat_available,
        },

        estimated_distance_km: form.estimated_distance_km
          ? parseFloat(form.estimated_distance_km)
          : null,

        estimated_duration_min: form.estimated_duration_min
          ? parseInt(form.estimated_duration_min, 10)
          : null,

        // Send route coordinates as an array.
        route_polyline: form.routeCoords.length
          ? form.routeCoords
          : null,

        status,
      };

      await rideApi.create(payload);
      navigate('/driver/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ride.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVehicle = vehicles.find(
    v => String(v.id) === String(form.vehicle_id)
  );

  const todayStr = new Date().toISOString().slice(0, 16);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create a Ride</h1>
      <p className="text-gray-500 mb-6">Share your journey and split the cost.</p>

      <StepIndicator current={step} />

      {error && <Alert type="error" message={error} />}

      {/* STEP 0: Route */}
      {step === 0 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Navigation size={20} className="text-primary-600" /> Route
          </h2>

          <div>
            <label className="label">Origin <span className="text-red-500">*</span></label>
            <LocationSearch
              placeholder="Where are you starting?"
              value={form.origin}
              onSelect={handleOriginSelect}
            />
          </div>

          {form.stops.map((stop, idx) => (
            <div key={idx}>
              <label className="label">Stop {idx + 1}</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <LocationSearch
                    placeholder="Add a stop"
                    value={stop}
                    onSelect={val => updateStop(idx, val)}
                  />
                </div>
                <button type="button" onClick={() => removeStop(idx)} className="btn-secondary">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {form.stops.length < 3 && (
            <button type="button" onClick={addStop} className="text-sm text-primary-600 font-medium flex items-center gap-1">
              <Plus size={16} /> Add Stop
            </button>
          )}

          <div>
            <label className="label">Destination <span className="text-red-500">*</span></label>
            <LocationSearch
              placeholder="Where are you going?"
              value={form.destination}
              onSelect={handleDestinationSelect}
            />
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={handleFetchRoute} disabled={fetchingRoute} className="btn-secondary flex items-center gap-2">
              {fetchingRoute ? <Spinner size="sm" /> : <Navigation size={16} />}
              Calculate Route
            </button>

            {form.estimated_distance_km && (
              <span className="text-sm text-gray-600">
                {formatDistance(form.estimated_distance_km)}
                {form.estimated_duration_min && ` · ${formatDuration(form.estimated_duration_min)}`}
              </span>
            )}
          </div>

          <RouteMap
            origin={form.origin}
            destination={form.destination}
            stops={form.stops.filter(Boolean)}
            routeCoords={form.routeCoords}
            height="250px"
          />
        </div>
      )}

      {/* STEP 1: Ride Details */}
      {step === 1 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Car size={20} className="text-primary-600" /> Ride Details
          </h2>

          <div>
            <label className="label">Departure Date & Time <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              min={todayStr}
              value={form.departure_datetime}
              onChange={e => set('departure_datetime', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Vehicle <span className="text-red-500">*</span></label>
            <select
              value={form.vehicle_id}
              onChange={e => set('vehicle_id', e.target.value)}
              className="input"
            >
              <option value="">Select your vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} - {v.registration_number}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Available Seats</label>
              <input
                type="number"
                min="1"
                max="8"
                value={form.available_seats}
                onChange={e => set('available_seats', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Contribution Per Seat (₹) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="0"
                value={form.contribution_per_seat}
                onChange={e => set('contribution_per_seat', e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Toll Charges (₹)</label>
            <input
              type="number"
              min="0"
              value={form.toll_charges}
              onChange={e => set('toll_charges', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Booking Type</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${form.booking_type === 'auto' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="booking_type"
                  value="auto"
                  checked={form.booking_type === 'auto'}
                  onChange={e => set('booking_type', e.target.value)}
                  className="sr-only"
                />
                <Zap size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Instant Booking</p>
                  <p className="text-xs text-gray-500">Bookings confirmed automatically</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${form.booking_type === 'manual' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="booking_type"
                  value="manual"
                  checked={form.booking_type === 'manual'}
                  onChange={e => set('booking_type', e.target.value)}
                  className="sr-only"
                />
                <Users size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Manual Approval</p>
                  <p className="text-xs text-gray-500">Approve each passenger request</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="label">Ride Type</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${form.ride_type === 'regular' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="ride_type"
                  value="regular"
                  checked={form.ride_type === 'regular'}
                  onChange={e => set('ride_type', e.target.value)}
                  className="sr-only"
                />
                <span className="text-xl">🚗</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Regular</p>
                  <p className="text-xs text-gray-500">Open to all passengers</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${form.ride_type === 'women_only' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="ride_type"
                  value="women_only"
                  checked={form.ride_type === 'women_only'}
                  onChange={e => set('ride_type', e.target.value)}
                  className="sr-only"
                />
                <span className="text-xl">👩</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Women-Only</p>
                  <p className="text-xs text-gray-500">Female passengers only</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cancellation Window (hours)</label>
              <input
                type="number"
                min="0"
                max="72"
                value={form.cancellation_hours}
                onChange={e => set('cancellation_hours', e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Additional Instructions</label>
            <textarea
              rows={3}
              value={form.additional_instructions}
              onChange={e => set('additional_instructions', e.target.value)}
              placeholder="Any special notes for passengers..."
              className="input resize-none"
            />
          </div>
        </div>
      )}

      {/* STEP 2: Preferences */}
      {step === 2 && (
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Ride Preferences</h2>

          <Toggle value={form.ac} onChange={v => set('ac', v)} label="Air Conditioning" icon={Wind} description="AC will be on during the ride" />
          <Toggle value={form.smoking_allowed} onChange={v => set('smoking_allowed', v)} label="Smoking Allowed" icon={Cigarette} description="Passengers may smoke" />
          <Toggle value={form.pets_allowed} onChange={v => set('pets_allowed', v)} label="Pets Allowed" icon={PawPrint} description="Passengers may bring pets" />
          <Toggle value={form.food_allowed} onChange={v => set('food_allowed', v)} label="Food Allowed" icon={Utensils} description="Passengers may eat inside" />
          <Toggle value={form.music_allowed} onChange={v => set('music_allowed', v)} label="Music Allowed" icon={Music} description="Music will be played" />
          <Toggle value={form.front_seat_available} onChange={v => set('front_seat_available', v)} label="Front Seat Available" icon={Armchair} description="Front passenger seat offered" />

          <div>
            <label className="label">Luggage Size</label>
            <select
              value={form.luggage_size}
              onChange={e => set('luggage_size', e.target.value)}
              className="input"
            >
              <option value="small">Small (cabin bag)</option>
              <option value="large">Large (full suitcase)</option>
              <option value="both">Both sizes welcome</option>
            </select>
          </div>
        </div>
      )}

      {/* STEP 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Your Ride</h2>

            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Route</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{form.origin?.address}</p>
                </div>

                {form.stops.filter(Boolean).map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{s?.address}</p>
                  </div>
                ))}

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{form.destination?.address}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-200 mb-4">
              <RouteMap
                origin={form.origin}
                destination={form.destination}
                stops={form.stops.filter(Boolean)}
                routeCoords={form.routeCoords}
                height="220px"
                interactive={false}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Departure</p>
                <p className="text-sm font-semibold">
                  {form.departure_datetime
                    ? new Date(form.departure_datetime).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : '—'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Seats</p>
                <p className="text-sm font-semibold">{form.available_seats}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Contribution</p>
                <p className="text-sm font-semibold text-primary-700">
                  {formatCurrency(form.contribution_per_seat)}/seat
                </p>
              </div>

              {form.toll_charges && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Toll Charges</p>
                  <p className="text-sm font-semibold">{formatCurrency(form.toll_charges)}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Booking</p>
                <p className="text-sm font-semibold capitalize">
                  {form.booking_type === 'auto' ? '⚡ Instant' : '✋ Manual'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Ride Type</p>
                <p className="text-sm font-semibold">
                  {form.ride_type === 'women_only' ? '👩 Women-Only' : '🚗 Regular'}
                </p>
              </div>

              {form.estimated_distance_km && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="text-sm font-semibold">
                    {formatDistance(form.estimated_distance_km)}
                  </p>
                </div>
              )}
            </div>

            {selectedVehicle && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                <div className="w-12 h-9 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedVehicle.image ? (
                    <img
                      src={`http://localhost:5000${selectedVehicle.image}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Car size={18} className="text-gray-400" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    {selectedVehicle.make} {selectedVehicle.model}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedVehicle.registration_number} · {selectedVehicle.color}
                  </p>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Preferences</p>
              <div className="flex flex-wrap gap-2">
                {form.ac && <span className="badge badge-blue">❄ AC</span>}
                {form.smoking_allowed && <span className="badge badge-yellow">🚬 Smoking</span>}
                {form.pets_allowed && <span className="badge badge-green">🐾 Pets OK</span>}
                {form.food_allowed && <span className="badge badge-green">🍕 Food OK</span>}
                {form.music_allowed && <span className="badge badge-blue">🎵 Music</span>}
                {form.front_seat_available && <span className="badge badge-gray">💺 Front Seat</span>}
                <span className="badge badge-gray">🧳 Luggage: {form.luggage_size}</span>
              </div>
            </div>

            {form.additional_instructions && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Instructions</p>
                <p className="text-sm text-gray-700">{form.additional_instructions}</p>
              </div>
            )}
          </div>

          {error && <Alert type="error" message={error} />}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={submitting}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              {submitting ? <Spinner size="sm" /> : null}
              Save as Draft
            </button>

            <button
              type="button"
              onClick={() => handleSubmit('published')}
              disabled={submitting}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {submitting ? <Spinner size="sm" /> : null}
              Publish Ride
            </button>
          </div>
        </div>
      )}

      {step < 3 && (
        <div className="flex justify-between mt-6">
          {step > 0 ? (
            <button type="button" onClick={prevStep} className="btn-secondary flex items-center gap-2">
              <ChevronLeft size={18} /> Back
            </button>
          ) : (
            <div />
          )}

          <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2">
            {step === 2 ? 'Review Ride' : 'Continue'} <ChevronRight size={18} />
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4">
          <button type="button" onClick={prevStep} className="btn-secondary flex items-center gap-2">
            <ChevronLeft size={18} /> Back
          </button>
        </div>
      )}
    </div>
  );
}