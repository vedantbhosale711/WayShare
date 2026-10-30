import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, IndianRupee, Star, Car, Zap, Wind } from 'lucide-react';
import { RideTypeBadge, formatDate, formatDistance, formatDuration, StatusBadge, StarRating } from './ui.jsx';

export default function RideCard({ ride, showBookButton = true }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
            {ride.driver_photo ? (
              <img src={`http://localhost:5000${ride.driver_photo}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <Car size={18} className="text-primary-700" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{ride.driver_name}</p>
            {ride.average_rating > 0 && <StarRating rating={ride.average_rating} size={12} />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RideTypeBadge type={ride.ride_type} />
          {ride.status && <StatusBadge status={ride.status} />}
        </div>
      </div>

      {/* Route */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2">
          <div className="mt-1 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <p className="text-sm text-gray-700 line-clamp-1">{ride.origin_address}</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <p className="text-sm text-gray-700 line-clamp-1">{ride.destination_address}</p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500 mb-0.5">Departure</p>
          <p className="text-xs font-medium text-gray-800">{formatDate(ride.departure_datetime)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500 mb-0.5">Seats Left</p>
          <p className="text-sm font-semibold text-gray-800">{ride.available_seats}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500 mb-0.5">Distance</p>
          <p className="text-sm font-semibold text-gray-800">{formatDistance(ride.estimated_distance_km)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500 mb-0.5">Duration</p>
          <p className="text-sm font-semibold text-gray-800">{formatDuration(ride.estimated_duration_min)}</p>
        </div>
      </div>

      {/* Vehicle + preferences */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Car size={12} />
          <span>{ride.make} {ride.model} · {ride.registration_number}</span>
        </div>
        <div className="flex items-center gap-2">
          {ride.ac && <span title="AC" className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">AC</span>}
          {ride.booking_type === 'auto' && <span title="Instant booking" className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">Instant</span>}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          <span className="text-2xl font-bold text-primary-700">₹{ride.contribution_per_seat?.toLocaleString('en-IN')}</span>
          <span className="text-xs text-gray-500 ml-1">per seat</span>
        </div>
        {showBookButton && (
          <Link
            to={`/rides/${ride.id}`}
            className="btn-primary text-sm px-4 py-2"
          >
            View & Book
          </Link>
        )}
      </div>
    </div>
  );
}
