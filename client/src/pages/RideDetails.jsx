
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, CalendarDays, Clock, Users, Car,
  Star, Snowflake, Cigarette, PawPrint, Utensils,
  Music, Briefcase, Armchair, ShieldCheck, Loader2,
  AlertCircle, CheckCircle2, IndianRupee
} from 'lucide-react';
import { rideApi, bookingApi } from '../api';
import RouteMap from '../components/RouteMap';

const API_URL = 'http://localhost:5000';

const imageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_URL}${path}`;
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

const formatTime = (value) =>
  new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
        <Icon size={19} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Preference({ label, enabled, icon: Icon }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <Icon size={17} />
        {label}
      </div>
      <span className={`text-xs font-semibold ${enabled ? 'text-green-600' : 'text-gray-400'}`}>
        {enabled ? 'Allowed' : 'Not allowed'}
      </span>
    </div>
  );
}

export default function RideDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadRide = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await rideApi.get(id);
        setRide(response?.data ?? response);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load this ride.');
      } finally {
        setLoading(false);
      }
    };

    loadRide();
  }, [id]);

  const handleBooking = async () => {
    if (!localStorage.getItem('ws_token')) {
      navigate('/login', { state: { from: `/rides/${id}` } });
      return;
    }

    try {
      setBooking(true);
      setError('');
      setSuccess('');

      const response = await bookingApi.create({
        ride_id: ride.id,
        seats_booked: seats
      });

      const result = response?.data ?? response;
      const status = result.status || result.booking?.status;

      if (status === 'confirmed') {
        setSuccess('Your booking is confirmed!');
      } else {
        setSuccess('Your booking request has been sent. Waiting for driver confirmation.');
      }

      const updated = await rideApi.get(id);
      setRide(updated?.data ?? updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={36} />
      </div>
    );
  }

  if (error && !ride) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <AlertCircle size={42} className="mb-4 text-red-500" />
        <h2 className="text-2xl font-bold">Ride not found</h2>
        <p className="mt-2 text-gray-500">{error}</p>
        <button
          onClick={() => navigate('/rides/search')}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          Back to search
        </button>
      </div>
    );
  }

  const preferences = [
    { label: 'Air conditioning', enabled: ride.ac, icon: Snowflake },
    { label: 'Smoking', enabled: ride.smoking_allowed, icon: Cigarette },
    { label: 'Pets', enabled: ride.pets_allowed, icon: PawPrint },
    { label: 'Food', enabled: ride.food_allowed, icon: Utensils },
    { label: 'Music', enabled: ride.music_allowed, icon: Music },
    { label: 'Front seat', enabled: ride.front_seat_available, icon: Armchair }
  ];

  const origin = ride.origin_lat != null && ride.origin_lng != null
    ? { lat: ride.origin_lat, lng: ride.origin_lng, address: ride.origin_address }
    : null;

  const destination = ride.destination_lat != null && ride.destination_lng != null
    ? { lat: ride.destination_lat, lng: ride.destination_lng, address: ride.destination_address }
    : null;

  const isUnavailable =
    ride.status !== 'published' ||
    ride.available_seats <= 0 ||
    new Date(ride.departure_datetime) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                ride.ride_type === 'women_only'
                  ? 'bg-pink-100 text-pink-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {ride.ride_type === 'women_only' ? 'Women-only ride' : 'Regular ride'}
              </span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                {ride.booking_type === 'auto' ? 'Instant booking' : 'Driver approval required'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Ride details
            </h1>
            <p className="mt-1 text-gray-500">
              Review the journey and driver before booking.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          <div className="space-y-6">

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-bold text-gray-900">Your journey</h2>

              <div className="grid gap-6 sm:grid-cols-2">
                <Detail icon={CalendarDays} label="Departure date" value={formatDate(ride.departure_datetime)} />
                <Detail icon={Clock} label="Departure time" value={formatTime(ride.departure_datetime)} />
                <Detail icon={Users} label="Available seats" value={`${ride.available_seats} of ${ride.total_seats}`} />
                <Detail
                  icon={IndianRupee}
                  label="Contribution per seat"
                  value={`₹${Number(ride.contribution_per_seat).toLocaleString('en-IN')}`}
                />
              </div>

              <div className="my-6 border-t border-gray-100" />

              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="mt-1 flex flex-col items-center">
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="my-1 h-12 border-l-2 border-dashed border-gray-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pickup</p>
                    <p className="mt-1 font-semibold text-gray-900">{ride.origin_address}</p>
                  </div>
                </div>

                {ride.stops?.map((stop, index) => (
                  <div key={stop.id || index} className="flex gap-4">
                    <div className="flex w-3 justify-center">
                      <span className="h-3 w-3 rounded-full bg-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Stop {index + 1}
                      </p>
                      <p className="mt-1 font-medium text-gray-800">{stop.address}</p>
                    </div>
                  </div>
                ))}

                <div className="flex gap-4">
                  <div className="mt-1">
                    <span className="block h-3 w-3 rounded-sm bg-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Destination</p>
                    <p className="mt-1 font-semibold text-gray-900">{ride.destination_address}</p>
                  </div>
                </div>
              </div>

              {(ride.estimated_distance_km || ride.estimated_duration_min) && (
                <div className="mt-6 flex flex-wrap gap-6 border-t border-gray-100 pt-5 text-sm text-gray-600">
                  {ride.estimated_distance_km && (
                    <span>{ride.estimated_distance_km} km</span>
                  )}
                  {ride.estimated_duration_min && (
                    <span>{Math.floor(ride.estimated_duration_min / 60)}h {ride.estimated_duration_min % 60}m estimated</span>
                  )}
                </div>
              )}
            </section>

            {(origin || destination) && (
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-bold text-gray-900">Route map</h2>
                {origin && destination ? (
                  <RouteMap
                    origin={origin}
                    destination={destination}
                    stops={ride.stops || []}
                    height="360px"
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    Complete route coordinates are not available for this ride.
                  </p>
                )}
              </section>
            )}

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-gray-900">About the driver</h2>

              <div className="flex flex-wrap items-center gap-4">
                {ride.driver_photo ? (
                  <img
                    src={imageUrl(ride.driver_photo)}
                    alt={ride.driver_name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                    {ride.driver_name?.charAt(0)}
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{ride.driver_name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star size={15} className="fill-yellow-400 text-yellow-400" />
                      {Number(ride.average_rating || 0).toFixed(1)}
                    </span>
                    <span>{ride.driver_total_rides || 0} rides completed</span>
                  </div>
                </div>

                <ShieldCheck className="text-green-600" size={26} />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-gray-900">Vehicle details</h2>

              <div className="flex flex-wrap gap-5">
                {ride.vehicle_image && (
                  <img
                    src={imageUrl(ride.vehicle_image)}
                    alt={`${ride.make} ${ride.model}`}
                    className="h-28 w-40 rounded-xl object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {ride.make} {ride.model}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {ride.color} · {ride.vehicle_type}
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-700">
                    {ride.registration_number}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {ride.vehicle_seats} seats
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-gray-900">Ride preferences</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {preferences.map((item) => (
                  <Preference key={item.label} {...item} />
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <Briefcase size={16} className="mr-2 inline" />
                Luggage: <span className="font-semibold capitalize">{ride.luggage_size || 'Small'}</span>
              </div>
            </section>

            {ride.additional_instructions && (
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-gray-900">Additional instructions</h2>
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {ride.additional_instructions}
                </p>
              </section>
            )}
          </div>

          <aside>
            <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Contribution per seat</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                ₹{Number(ride.contribution_per_seat).toLocaleString('en-IN')}
              </p>

              <div className="my-6 border-t border-gray-100" />

              <label className="text-sm font-semibold text-gray-800">
                Number of seats
              </label>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 p-2">
                <button
                  onClick={() => setSeats((value) => Math.max(1, value - 1))}
                  disabled={seats <= 1}
                  className="h-9 w-9 rounded-lg bg-gray-100 text-lg font-bold disabled:opacity-40"
                >
                  −
                </button>
                <span className="font-bold">{seats}</span>
                <button
                  onClick={() => setSeats((value) => Math.min(ride.available_seats, value + 1))}
                  disabled={seats >= ride.available_seats}
                  className="h-9 w-9 rounded-lg bg-gray-100 text-lg font-bold disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <div className="my-6 space-y-3 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>₹{Number(ride.contribution_per_seat).toLocaleString('en-IN')} × {seats} seat(s)</span>
                  <span>₹{(Number(ride.contribution_per_seat) * seats).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900">
                  <span>Total contribution</span>
                  <span>₹{(Number(ride.contribution_per_seat) * seats).toLocaleString('en-IN')}</span>
                </div>
                {Number(ride.toll_charges) > 0 && (
                  <p className="text-xs text-gray-500">
                    Toll charges: ₹{Number(ride.toll_charges).toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              {error && (
                <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              {success && (
                <div className="mb-4 flex gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle2 size={18} className="shrink-0" />
                  {success}
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={isUnavailable || booking || !!success}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {booking ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : success ? (
                  'Request submitted'
                ) : isUnavailable ? (
                  'Ride unavailable'
                ) : (
                  'Book this ride'
                )}
              </button>

              <p className="mt-3 text-center text-xs text-gray-400">
                {ride.booking_type === 'auto'
                  ? 'Your booking will be confirmed automatically.'
                  : 'Your request will be sent to the driver for approval.'}
              </p>

              <div className="mt-6 rounded-xl bg-gray-50 p-4 text-xs leading-5 text-gray-500">
                <ShieldCheck size={17} className="mb-2 text-green-600" />
                Cancellation is allowed up to {ride.cancellation_hours} hours before departure for confirmed bookings.
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
