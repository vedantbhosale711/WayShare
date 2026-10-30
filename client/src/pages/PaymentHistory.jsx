import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, TrendingUp, TrendingDown, MapPin, Calendar,
  Users, CheckCircle, AlertCircle, Filter
} from 'lucide-react';
import { paymentApi } from '../api/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Spinner, EmptyState, StatusBadge, formatCurrency, formatDate } from '../components/ui.jsx';

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'refunded',  label: 'Refunded' },
];

const STATUS_BADGE = {
  completed: 'badge-green',
  pending:   'badge-yellow',
  refunded:  'badge-blue',
  failed:    'badge-red',
};

function SummaryCard({ icon: Icon, label, amount, color, bgColor }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bgColor} shrink-0`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(amount)}</p>
      </div>
    </div>
  );
}

export default function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');
  const [markingPaid, setMarkingPaid] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await paymentApi.history();
      setPayments(res.data?.payments || res.data || []);
    } catch (err) {
      setError('Failed to load payment history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const filteredPayments = activeStatus === 'all'
    ? payments
    : payments.filter(p => p.status === activeStatus);

  const totalSpent = payments
    .filter(p => p.status === 'completed' && p.payer?._id === user?._id)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalEarned = payments
    .filter(p => p.status === 'completed' && p.payee?._id === user?._id)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleMarkPaid = async (payment) => {
    setMarkingPaid(prev => ({ ...prev, [payment._id]: true }));
    setError('');
    try {
      await paymentApi.update(payment._id, {
        status: 'completed',
        payment_method: 'cash',
      });
      setSuccess('Payment marked as completed.');
      fetchPayments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update payment.');
    } finally {
      setMarkingPaid(prev => ({ ...prev, [payment._id]: false }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
        <p className="text-gray-500 text-sm mt-1">Track your ride payments and earnings.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <SummaryCard
          icon={TrendingDown}
          label="Total Spent"
          amount={totalSpent}
          color="text-red-500"
          bgColor="bg-red-50"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Total Earnings"
          amount={totalEarned}
          color="text-green-600"
          bgColor="bg-green-50"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveStatus(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeStatus === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments found"
          description={activeStatus === 'all' ? 'Your payment history will appear here.' : `No ${activeStatus} payments.`}
        />
      ) : (
        <div className="space-y-3">
          {filteredPayments.map(payment => {
            const ride = payment.ride || payment.booking?.ride || {};
            const isPayer = payment.payer?._id === user?._id;
            const canMarkPaid = payment.status === 'pending' && isPayer;

            return (
              <div key={payment._id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Ride Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={13} className="text-primary-500 shrink-0" />
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {ride.origin?.name || 'N/A'} → {ride.destination?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {ride.departure_time && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(ride.departure_time)}
                        </span>
                      )}
                      {payment.seats && (
                        <span className="flex items-center gap-1">
                          <Users size={11} />
                          {payment.seats} seat{payment.seats !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className={isPayer ? 'text-red-500' : 'text-green-600'}>
                        {isPayer ? `To: ${payment.payee?.full_name || 'Driver'}` : `From: ${payment.payer?.full_name || 'Passenger'}`}
                      </span>
                      {payment.payment_method && (
                        <span className="capitalize">{payment.payment_method}</span>
                      )}
                    </div>
                  </div>

                  {/* Amount & Status */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className={`font-bold text-lg ${isPayer ? 'text-red-600' : 'text-green-600'}`}>
                        {isPayer ? '-' : '+'}{formatCurrency(payment.amount)}
                      </p>
                    </div>
                    <span className={`badge ${STATUS_BADGE[payment.status] || 'badge-gray'} capitalize`}>
                      {payment.status}
                    </span>
                    {canMarkPaid && (
                      <button
                        onClick={() => handleMarkPaid(payment)}
                        disabled={markingPaid[payment._id]}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                      >
                        {markingPaid[payment._id] ? <Spinner size="sm" /> : <CheckCircle size={13} />}
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
