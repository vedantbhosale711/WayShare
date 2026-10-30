import { useState, useEffect } from 'react';
import {
  Bell, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  ClipboardList, Ban, AlertCircle, CheckCheck
} from 'lucide-react';
import { notificationApi } from '../api/index.js';
import { Spinner, EmptyState } from '../components/ui.jsx';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_CONFIG = {
  booking_request:   { icon: ClipboardList, bg: 'bg-blue-100', color: 'text-blue-600', label: 'Booking Request' },
  booking_confirmed: { icon: CheckCircle,   bg: 'bg-green-100', color: 'text-green-600', label: 'Confirmed' },
  booking_cancelled: { icon: XCircle,       bg: 'bg-red-100', color: 'text-red-500', label: 'Cancelled' },
  ride_update:       { icon: RefreshCw,     bg: 'bg-yellow-100', color: 'text-yellow-600', label: 'Ride Update' },
  ride_cancelled:    { icon: Ban,           bg: 'bg-red-100', color: 'text-red-500', label: 'Ride Cancelled' },
};

function getConfig(type) {
  return TYPE_CONFIG[type] || { icon: Bell, bg: 'bg-gray-100', color: 'text-gray-600', label: 'Notification' };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.list();
      const data = res.data?.notifications || res.data || [];
      // Sort newest first
      const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(sorted);
    } catch (err) {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (notification) => {
    if (notification.is_read) return;
    try {
      await notificationApi.markRead(notification._id);
      setNotifications(prev =>
        prev.map(n => n._id === notification._id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      // silently fail
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      setError('Failed to mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="badge badge-blue">{unreadCount}</span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Stay updated on your rides and bookings.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {markingAll ? <Spinner size="sm" /> : <CheckCheck size={15} />}
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! Notifications will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const config = getConfig(notif.type);
            const Icon = config.icon;
            return (
              <button
                key={notif._id}
                onClick={() => handleMarkRead(notif)}
                className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 flex items-start gap-4 ${
                  notif.is_read
                    ? 'bg-white border-gray-100 hover:border-gray-200'
                    : 'bg-blue-50 border-blue-100 hover:border-blue-200'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${config.bg} shrink-0`}>
                  <Icon size={18} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${notif.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notif.title || config.label}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">{timeAgo(notif.created_at)}</span>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                  </div>
                  {notif.message && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
