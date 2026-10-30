import { useState, useEffect } from 'react';
import { userApi } from '../api/index.js';
import { Alert, Spinner, EmptyState } from '../components/ui.jsx';
import { Phone, Mail, User, Edit, Trash2, ShieldCheck } from 'lucide-react';

export default function EmergencyContacts() {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ contact_name: '', mobile: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchContact = async () => {
    try {
      const res = await userApi.getEmergencyContact();
      setContact(res.data);
      if (res.data) setForm({ contact_name: res.data.contact_name, mobile: res.data.mobile, email: res.data.email || '' });
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchContact(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.contact_name || !form.mobile) { setMsg({ type: 'error', text: 'Name and mobile are required' }); return; }
    setSaving(true); setMsg({ type: '', text: '' });
    try {
      await userApi.upsertEmergencyContact(form);
      await fetchContact();
      setEditing(false);
      setMsg({ type: 'success', text: 'Emergency contact saved!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Save failed' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove emergency contact?')) return;
    setDeleting(true);
    try {
      await userApi.deleteEmergencyContact();
      setContact(null);
      setForm({ contact_name: '', mobile: '', email: '' });
      setMsg({ type: 'success', text: 'Emergency contact removed.' });
    } catch { setMsg({ type: 'error', text: 'Delete failed' }); }
    finally { setDeleting(false); }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <ShieldCheck size={22} className="text-primary-600" /> Emergency Contact
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        After a ride booking is confirmed, WayShare sends your driver's details to this contact for your safety.
      </p>

      {msg.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : contact && !editing ? (
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <User size={22} className="text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{contact.contact_name}</p>
                <span className="badge badge-green text-xs">Emergency Contact</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(true); setMsg({ type: '', text: '' }); }}
                className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5">
                <Edit size={12} /> Edit
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="btn-danger text-xs flex items-center gap-1 px-3 py-1.5">
                <Trash2 size={12} /> {deleting ? '...' : 'Remove'}
              </button>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={14} className="text-primary-500" />
              <span>{contact.mobile}</span>
            </div>
            {contact.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={14} className="text-primary-500" />
                <span>{contact.email}</span>
              </div>
            )}
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
            🔒 This person will be notified with your driver's name, mobile number, vehicle details, and departure info whenever you confirm a booking.
          </div>
        </div>
      ) : (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">{contact ? 'Edit Contact' : 'Add Emergency Contact'}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Contact Name *</label>
              <input type="text" className="input" placeholder="e.g. Mom, Dad, Best Friend"
                value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Mobile Number *</label>
              <input type="tel" className="input" placeholder="9876543210" maxLength={10}
                value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Email Address <span className="text-gray-400 font-normal">(recommended for notifications)</span></label>
              <input type="email" className="input" placeholder="contact@example.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              {editing && (
                <button type="button" onClick={() => setEditing(false)} className="flex-1 btn-secondary">Cancel</button>
              )}
              <button type="submit" disabled={saving} className={`btn-primary flex items-center gap-2 ${editing ? 'flex-1' : 'w-full'}`}>
                {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Contact'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!contact && !loading && !editing && (
        <div className="mt-4 text-center">
          <button onClick={() => setEditing(true)} className="btn-primary flex items-center gap-2 mx-auto">
            + Add Emergency Contact
          </button>
        </div>
      )}
    </div>
  );
}
