import { Link } from 'react-router-dom';

export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={`animate-spin rounded-full ${sizes[size]} border-b-2 border-primary-600`} />
  );
};

export const LoadingPage = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-16">
    {Icon && (
      <Icon className="mx-auto text-gray-300 mb-4" size={48} />
    )}

    <h3 className="text-lg font-semibold text-gray-700 mb-2">
      {title}
    </h3>

    <p className="text-gray-500 text-sm mb-4">
      {description}
    </p>

    {action && (
      <Link
        to={action.to}
        className="btn-primary inline-flex items-center justify-center"
      >
        {action.label}
      </Link>
    )}
  </div>
);

export const Alert = ({ type = 'error', message }) => {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };
  if (!message) return null;
  return (
    <div className={`border rounded-lg p-3 text-sm ${styles[type]}`}>
      {message}
    </div>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    pending: 'badge-yellow',
    confirmed: 'badge-green',
    rejected: 'badge-red',
    cancelled: 'badge-red',
    completed: 'badge-blue',
    published: 'badge-green',
    draft: 'badge-gray',
    ongoing: 'badge-blue',
  };
  return <span className={map[status] || 'badge-gray'}>{status?.charAt(0).toUpperCase() + status?.slice(1)}</span>;
};

export const RideTypeBadge = ({ type }) =>
  type === 'women_only'
    ? <span className="badge badge-pink">👩 Women-Only</span>
    : <span className="badge badge-blue">🚗 Regular</span>;

export const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

export const formatDate = (dt) => {
  if (!dt) return 'N/A';
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

export const formatDistance = (km) => km ? `${parseFloat(km).toFixed(1)} km` : 'N/A';
export const formatDuration = (min) => {
  if (!min) return 'N/A';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const StarRating = ({ rating, size = 16 }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <svg key={s} width={size} height={size} viewBox="0 0 20 20" fill={s <= Math.round(rating) ? '#f59e0b' : '#d1d5db'}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
    <span className="text-sm text-gray-600 ml-1">{parseFloat(rating || 0).toFixed(1)}</span>
  </div>
);
