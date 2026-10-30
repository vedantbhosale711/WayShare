import { useState, useEffect } from 'react';
import { adminApi } from '../api/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LoadingPage, Alert, StatusBadge, formatDate } from '../components/ui.jsx';
import { Navigate } from 'react-router-dom';
import { Users, Car, Flag, LifeBuoy, BarChart2, Search, Shield, CheckCircle, XCircle } from 'lucide-react';

const TABS = ['Overview', 'Users', 'Rides', 'Reports', 'Support Tickets'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (tab === 0) { const r = await adminApi.stats(); setStats(r.data); }
        if (tab === 1) { const r = await adminApi.users({ search: userSearch, role: userRole }); setUsers(r.data); }
        if (tab === 2) { const r = await adminApi.rides(); setRides(r.data); }
        if (tab === 3) { const r = await adminApi.reports(); setReports(r.data); }
        if (tab === 4) { const r = await adminApi.tickets(); setTickets(r.data); }
      } catch { setError('Failed to load data'); }
      finally { setLoading(false); }
    };
    load();
  }, [tab]);

  const handleToggleUser = async (id) => {
    try {
      const res = await adminApi.toggleUser(id);
      setUsers(u => u.map(x => x.id === id ? { ...x, is_active: res.data.is_active } : x));
      setSuccess(`User ${res.data.is_active ? 'activated' : 'deactivated'}`);
    } catch { setError('Action failed'); }
  };

  const handleUpdateReport = async (id, status, admin_notes) => {
    try {
      await adminApi.updateReport(id, { status, admin_notes });
      setReports(r => r.map(x => x.id === id ? { ...x, status, admin_notes } : x));
      setSuccess('Report updated');
    } catch { setError('Update failed'); }
  };

  const handleUpdateTicket = async (id, status, admin_reply) => {
    try {
      await adminApi.updateTicket(id, { status, admin_reply });
      setTickets(t => t.map(x => x.id === id ? { ...x, status, admin_reply } : x));
      setSuccess('Ticket updated');
    } catch { setError('Update failed'); }
  };

  const statCards = stats ? [
    { label: 'Total Users', value: stats.total_users, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Drivers', value: stats.total_drivers, icon: Car, color: 'bg-primary-50 text-primary-600' },
    { label: 'Total Rides', value: stats.total_rides, icon: Car, color: 'bg-green-50 text-green-600' },
    { label: 'Active Rides', value: stats.active_rides, icon: BarChart2, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Bookings', value: stats.total_bookings, icon: CheckCircle, color: 'bg-purple-50 text-purple-600' },
    { label: 'Open Reports', value: stats.open_reports, icon: Flag, color: 'bg-red-50 text-red-600' },
    { label: 'Open Tickets', value: stats.open_tickets, icon: LifeBuoy, color: 'bg-orange-50 text-orange-600' },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">WayShare platform management</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`flex-1 min-w-max px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === i ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <LoadingPage /> : (
        <>
          {/* Overview */}
          {tab === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {statCards.map(s => (
                <div key={s.label} className="card">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                    <s.icon size={20} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Users */}
          {tab === 1 && (
            <div>
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" className="input pl-8 text-sm" placeholder="Search by name, email, mobile..."
                    value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && adminApi.users({ search: userSearch, role: userRole }).then(r => setUsers(r.data))} />
                </div>
                <select className="input w-36 text-sm" value={userRole} onChange={e => {
                  setUserRole(e.target.value);
                  adminApi.users({ search: userSearch, role: e.target.value }).then(r => setUsers(r.data));
                }}>
                  <option value="">All Roles</option>
                  <option value="passenger">Passenger</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Name', 'Email', 'Mobile', 'Role', 'Driver', 'Status', 'Joined', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{u.full_name} {u.is_demo && <span className="badge badge-gray text-xs ml-1">Demo</span>}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3 text-gray-500">{u.mobile}</td>
                        <td className="px-4 py-3 capitalize"><span className="badge badge-blue">{u.role}</span></td>
                        <td className="px-4 py-3">{u.is_driver ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-gray-300" />}</td>
                        <td className="px-4 py-3"><span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleUser(u.id)}
                            className={`text-xs px-2 py-1 rounded-md font-medium ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rides */}
          {tab === 2 && (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Driver', 'Route', 'Date', 'Seats', 'Type', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rides.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.driver_name} {r.is_demo && <span className="badge badge-gray text-xs">Demo</span>}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-48 truncate">{r.origin_address} → {r.destination_address}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(r.departure_datetime)}</td>
                      <td className="px-4 py-3">{r.available_seats}/{r.total_seats}</td>
                      <td className="px-4 py-3"><span className={`badge ${r.ride_type === 'women_only' ? 'badge-pink' : 'badge-blue'}`}>{r.ride_type === 'women_only' ? '👩 Women-Only' : 'Regular'}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reports */}
          {tab === 3 && (
            <div className="space-y-4">
              {reports.length === 0 ? <p className="text-gray-500 text-center py-8">No reports</p> : reports.map(rep => (
                <div key={rep.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{rep.reason}</p>
                      <p className="text-xs text-gray-500">By {rep.reporter_name} against <strong>{rep.reported_name}</strong></p>
                      {rep.description && <p className="text-sm text-gray-600 mt-1">"{rep.description}"</p>}
                    </div>
                    <StatusBadge status={rep.status} />
                  </div>
                  <div className="flex gap-2 mt-3">
                    {['under_review', 'resolved', 'dismissed'].map(s => (
                      <button key={s} onClick={() => handleUpdateReport(rep.id, s, rep.admin_notes)}
                        className={`text-xs px-2 py-1 rounded capitalize ${rep.status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Support Tickets */}
          {tab === 4 && (
            <div className="space-y-4">
              {tickets.length === 0 ? <p className="text-gray-500 text-center py-8">No tickets</p> : tickets.map(t => (
                <TicketCard key={t.id} ticket={t} onUpdate={handleUpdateTicket} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TicketCard({ ticket, onUpdate }) {
  const [reply, setReply] = useState(ticket.admin_reply || '');
  const [status, setStatus] = useState(ticket.status || 'open');

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-800">{ticket.subject}</p>
          <p className="text-xs text-gray-500">{ticket.full_name} ({ticket.email}) · <span className="capitalize">{ticket.category}</span></p>
          <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>
      <div className="mt-3 space-y-2">
        <textarea rows={2} className="input text-sm resize-none" placeholder="Admin reply..."
          value={reply} onChange={e => setReply(e.target.value)} />
        <div className="flex gap-2">
          <select className="input text-sm w-36" value={status} onChange={e => setStatus(e.target.value)}>
            {['open', 'in_progress', 'resolved', 'closed'].map(s => (
              <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
            ))}
          </select>
          <button onClick={() => onUpdate(ticket.id, status, reply)} className="btn-primary text-sm px-3">
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
