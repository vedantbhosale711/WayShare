import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingApi, reviewApi, paymentApi } from '../api/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LoadingPage, Alert, StatusBadge, RideTypeBadge, formatDate, formatCurrency, StarRating } from '../components/ui.jsx';
import RouteMap from '../components/RouteMap.jsx';
import { Car, MapPin, Users, CalendarDays, CreditCard, Star, ChevronLeft, X } from 'lucide-react';

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-transform hover:scale-110">
          <span className={(s <= (hover || value)) ? 'text-amber-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  );
}

export default function BookingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [bookingRes, reviewRes] = await Promise.all([
        bookingApi.get(id),
        bookingApi.get(id).then(r => {
          if (r.data.status === 'completed') return reviewApi.myReview(id).catch(() => ({ data: null }));
          return { data: null };
        }),
      ]);
      setBooking(bookingRes.data);
      setExistingReview(reviewRes?.data || null);
    } catch {
      setError('Booking not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleCancel = async (e) => {
    e.preventDefault();
    setCancelLoading(true);
    try {
      await bookingApi.cancel(id, cancelReason);
      setSuccess('Booking cancelled successfully.');
      setShowCancelForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { setError('Please select a rating'); return; }
    setReviewLoading(true);
    try {
      await reviewApi.create({ booking_id: id, ...reviewForm });
      setSuccess('Review submitted! Thank you.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Review failed');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    try {
      // Find payment for this booking - mark paid
      const paymentsRes = await paymentApi.history();
      const payment = paymentsRes.data.find(p => p.booking_id === id && p.status === 'pending');
      if (payment) {
        await paymentApi.update(payment.id, { status: 'completed', payment_method: 'cash' });
        setSuccess('Payment marked as paid.');
        fetchData();
      }
    } catch (err) {
      setError('Failed to update payment');
    }
  };

  if (loading) return <LoadingPage />;
  if (!booking) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-gray-500">Booking not found.</p>
      <Link to="/bookings" className="btn-primary mt-4 inline-block">My Bookings</Link>
    </div>
  );

  const isPassenger = booking.passenger_id === user?.id;
  const canCancel = isPassenger && ['pending', 'confirmed'].includes(booking.status);
  const canReview = isPassenger && booking.status === 'completed' && !existingReview;

  const routePolyline = (() => {
    try { return typeof booking.route_polyline === 'string' ? JSON.parse(booking.route_polyline) : booking.route_polyline; }
    catch { return null; }
  })();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
        <StatusBadge status={booking.status} />
        <RideTypeBadge type={booking.ride_type} />
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - main details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Map */}
          {(booking.origin_lat && booking.destination_lat) && (
            <div className="card p-0 overflow-hidden">
              <RouteMap
                origin={{ lat: booking.origin_lat, lng: booking.origin_lng, address: booking.origin_address }}
                destination={{ lat: booking.destination_lat, lng: booking.destination_lng, address: booking.destination_address }}
                routeCoords={routePolyline || []}
                height="250px"
              />
            </div>
          )}

          {/* Route */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Route</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{booking.origin_address}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{booking.destination_address}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><CalendarDays size={11} /> {formatDate(booking.departure_datetime)}</span>
              <span className="flex items-center gap-1"><Users size={11} /> {booking.seats_booked} seat{booking.seats_booked > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Driver & Vehicle */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Driver & Vehicle</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                {booking.driver_photo ? (
                  <img src={`http://localhost:5000${booking.driver_photo}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users size={20} className="text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{booking.driver_name}</p>
                {booking.average_rating > 0 && <StarRating rating={booking.average_rating} size={13} />}
                {booking.status === 'confirmed' && (
                  <p className="text-xs text-gray-500">📞 {booking.driver_mobile}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {booking.vehicle_image && (
                <img src={`http://localhost:5000${booking.vehicle_image}`} alt="Vehicle" className="w-20 h-14 object-cover rounded-lg" />
              )}
              <div className="text-sm">
                <p className="font-medium text-gray-800">{booking.make} {booking.model} ({booking.color})</p>
                <p className="text-gray-500">{booking.registration_number} · {booking.vehicle_type}</p>
              </div>
            </div>
          </div>

          {/* Review Section */}
          {canReview && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Rate Your Experience</h3>
              <form onSubmit={handleReview} className="space-y-3">
                <div>
                  <label className="label">Rating *</label>
                  <StarInput value={reviewForm.rating} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} />
                </div>
                <div>
                  <label className="label">Comment (optional)</label>
                  <textarea rows={3} className="input resize-none" placeholder="Share your experience..."
                    value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
                </div>
                <button type="submit" disabled={reviewLoading} className="btn-primary text-sm">
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          {existingReview && (
            <div className="card bg-green-50 border-green-100">
              <h3 className="font-semibold text-gray-800 mb-2">Your Review</h3>
              <StarRating rating={existingReview.rating} />
              {existingReview.comment && <p className="text-sm text-gray-600 mt-2">"{existingReview.comment}"</p>}
            </div>
          )}
        </div>

        {/* Right - payment & actions */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Contribution/seat</span>
                <span>{formatCurrency(booking.contribution_per_seat)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Seats booked</span>
                <span>× {booking.seats_booked}</span>
              </div>
              {booking.toll_charges > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Toll charges</span>
                  <span>{formatCurrency(booking.toll_charges)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span className="text-primary-700">{formatCurrency(booking.total_amount)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">Payment Status</span>
                <StatusBadge status={booking.payment_status || 'pending'} />
              </div>
            </div>
            {isPassenger && booking.payment_status === 'pending' && booking.status === 'confirmed' && (
              <button onClick={handleMarkPaid} className="btn-primary w-full mt-4 text-sm flex items-center justify-center gap-2">
                <CreditCard size={14} /> Mark as Paid (Cash)
              </button>
            )}
          </div>

          {/* Status Timeline */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Booking Timeline</h3>
            <div className="space-y-3">
              {[
                { status: 'pending', label: 'Request Sent', done: true },
                { status: 'confirmed', label: 'Booking Confirmed', done: ['confirmed', 'completed'].includes(booking.status) },
                { status: 'completed', label: 'Ride Completed', done: booking.status === 'completed' },
              ].map((step, i) => (
                <div key={step.status} className={`flex items-center gap-3 ${step.done ? 'text-primary-700' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step.done ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300'}`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
              ))}
              {['cancelled', 'rejected'].includes(booking.status) && (
                <div className="flex items-center gap-3 text-red-600">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-red-100 border-2 border-red-600">✗</div>
                  <span className="text-sm font-medium capitalize">{booking.status}</span>
                </div>
              )}
            </div>
          </div>

          {canCancel && !showCancelForm && (
            <button onClick={() => setShowCancelForm(true)} className="btn-danger w-full flex items-center justify-center gap-2 text-sm">
              <X size={14} /> Cancel Booking
            </button>
          )}

          {showCancelForm && (
            <div className="card border-red-100 bg-red-50">
              <h4 className="font-semibold text-red-800 mb-3">Cancel Booking</h4>
              <form onSubmit={handleCancel} className="space-y-3">
                <textarea rows={2} className="input text-sm" placeholder="Reason (optional)"
                  value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowCancelForm(false)} className="flex-1 btn-secondary text-sm">Keep</button>
                  <button type="submit" disabled={cancelLoading} className="flex-1 btn-danger text-sm">
                    {cancelLoading ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
