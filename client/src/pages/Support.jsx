import { useState, useEffect } from 'react';
import { adminApi } from '../api/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Alert, Spinner, EmptyState, StatusBadge, formatDate } from '../components/ui.jsx';
import { LifeBuoy, Flag, ChevronRight, CheckCircle } from 'lucide-react';

const TABS = ['Submit Ticket', 'My Tickets', 'Report User'];

export default function Support() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', category: 'general' });
  const [reportForm, setReportForm] = useState({ reported_user_id: '', reason: 'inappropriate_behaviour', description: '' });

  const fetchMyTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await adminApi.myTickets();
      setMyTickets(res.data);
    } catch { } finally { setTicketsLoading(false); }
  };

  useEffect(() => { if (tab === 1) fetchMyTickets(); }, [tab]);

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.description) { setMsg({ type: 'error', text: 'Subject and description are required' }); return; }
    setLoading(true); setMsg({ type: '', text: '' });
    try {
      await adminApi.createTicket(ticketForm);
      setMsg({ type: 'success', text: 'Support ticket submitted! We will respond shortly.' });
      setTicketForm({ subject: '', description: '', category: 'general' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit ticket' });
    } finally { setLoading(false); }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.reported_user_id || !reportForm.reason) { setMsg({ type: 'error', text: 'User ID and reason are required' }); return; }
    setLoading(true); setMsg({ type: '', text: '' });
    try {
      await adminApi.createReport(reportForm);
      setMsg({ type: 'success', text: 'Report submitted. Our team will review it.' });
      setReportForm({ reported_user_id: '', reason: 'inappropriate_behaviour', description: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit report' });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <LifeBuoy size={22} className="text-primary-600" /> Help & Support
      </h1>
      <p className="text-gray-500 text-sm mb-6">Get help or report an issue to the WayShare team.</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => { setTab(i); setMsg({ type: '', text: '' }); }}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${tab === i ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {msg.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Submit Ticket */}
      {tab === 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <LifeBuoy size={16} className="text-primary-600" /> Submit a Support Ticket
          </h2>
          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={ticketForm.category} onChange={e => setTicketForm(f => ({ ...f, category: e.target.value }))}>
                <option value="general">General</option>
                <option value="payment">Payment</option>
                <option value="booking">Booking</option>
                <option value="driver">Driver Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Subject *</label>
              <input type="text" className="input" placeholder="Briefly describe your issue"
                value={ticketForm.subject} onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea rows={4} className="input resize-none" placeholder="Provide as much detail as possible..."
                value={ticketForm.description} onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Spinner size="sm" /> Submitting...</> : <><CheckCircle size={15} /> Submit Ticket</>}
            </button>
          </form>
        </div>
      )}

      {/* My Tickets */}
      {tab === 1 && (
        <div>
          {ticketsLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : myTickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="No support tickets"
              description="You haven't submitted any support tickets yet." />
          ) : (
            <div className="space-y-4">
              {myTickets.map(t => (
                <div key={t.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{t.subject}</p>
                      <p className="text-xs text-gray-400 capitalize">{t.category} · {formatDate(t.created_at)}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-sm text-gray-600">{t.description}</p>
                  {t.admin_reply && (
                    <div className="mt-3 p-3 bg-primary-50 border border-primary-100 rounded-lg">
                      <p className="text-xs font-semibold text-primary-700 mb-1">WayShare Support replied:</p>
                      <p className="text-sm text-gray-700">{t.admin_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report User */}
      {tab === 2 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Flag size={16} className="text-red-500" /> Report a User
          </h2>
          <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-700 mb-4">
            ⚠️ Please only report genuine safety concerns or violations. False reports may lead to account suspension.
          </div>
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div>
              <label className="label">User ID to Report *</label>
              <input type="text" className="input font-mono text-sm" placeholder="Paste the user's ID (UUID)"
                value={reportForm.reported_user_id} onChange={e => setReportForm(f => ({ ...f, reported_user_id: e.target.value }))} required />
              <p className="text-xs text-gray-400 mt-1">Find the user ID on their profile or booking details page</p>
            </div>
            <div>
              <label className="label">Reason *</label>
              <select className="input" value={reportForm.reason} onChange={e => setReportForm(f => ({ ...f, reason: e.target.value }))}>
                <option value="inappropriate_behaviour">Inappropriate Behaviour</option>
                <option value="fraud">Fraud / Scam</option>
                <option value="safety_concern">Safety Concern</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea rows={3} className="input resize-none" placeholder="Describe the incident..."
                value={reportForm.description} onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading} className="btn-danger w-full flex items-center justify-center gap-2">
              {loading ? <><Spinner size="sm" /> Submitting...</> : <><Flag size={15} /> Submit Report</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
