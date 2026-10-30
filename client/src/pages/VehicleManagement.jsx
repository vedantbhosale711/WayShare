import { useState, useEffect, useRef } from 'react';
import {
  Car, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle,
  Upload, Users, Calendar, Palette, Hash, Gauge
} from 'lucide-react';
import { vehicleApi } from '../api/index.js';
import { Spinner, EmptyState } from '../components/ui.jsx';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const VEHICLE_TYPES = [
  { value: 'car',  label: 'Car' },
  { value: 'suv',  label: 'SUV' },
  { value: 'van',  label: 'Van' },
  { value: 'bike', label: 'Bike' },
  { value: 'auto', label: 'Auto' },
];

const EMPTY_FORM = {
  registration_number: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  color: '',
  vehicle_type: 'car',
  total_seats: 4,
};

function VehicleModal({ isOpen, vehicle, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (vehicle) {
      setForm({
        registration_number: vehicle.registration_number || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || '',
        vehicle_type: vehicle.vehicle_type || 'car',
        total_seats: vehicle.total_seats || 4,
      });
      setImagePreview(vehicle.image_url ? `${API_BASE}${vehicle.image_url}` : null);
    } else {
      setForm(EMPTY_FORM);
      setImagePreview(null);
    }
    setImage(null);
    setError('');
  }, [vehicle, isOpen]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (!form.registration_number.trim()) return 'Registration number is required.';
    if (!form.make.trim()) return 'Make is required.';
    if (!form.model.trim()) return 'Model is required.';
    if (!form.color.trim()) return 'Color is required.';
    if (!form.year || form.year < 2000 || form.year > new Date().getFullYear() + 1) return 'Enter a valid year.';
    if (!form.total_seats || form.total_seats < 2 || form.total_seats > 9) return 'Seats must be 2–9.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('vehicle_image', image);
      const id = vehicle?.id || vehicle?._id;
      if (id) await vehicleApi.update(id, fd);
      else await vehicleApi.create(fd);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-xl">
              <Car size={18} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="label">Vehicle Photo <span className="text-gray-400 font-normal">(optional)</span></label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Vehicle" className="w-full h-44 object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                  <Upload size={28} />
                  <span className="text-sm font-medium">Click to upload vehicle photo</span>
                  <span className="text-xs">JPEG, PNG or WebP</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          {/* Registration */}
          <div>
            <label className="label">Registration Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="input uppercase tracking-widest"
              placeholder="e.g. MH01AB1234"
              value={form.registration_number}
              onChange={e => set('registration_number', e.target.value.toUpperCase())}
            />
          </div>

          {/* Make & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Make <span className="text-red-500">*</span></label>
              <input type="text" className="input" placeholder="e.g. Maruti Suzuki"
                value={form.make} onChange={e => set('make', e.target.value)} />
            </div>
            <div>
              <label className="label">Model <span className="text-red-500">*</span></label>
              <input type="text" className="input" placeholder="e.g. Swift"
                value={form.model} onChange={e => set('model', e.target.value)} />
            </div>
          </div>

          {/* Year & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Year <span className="text-red-500">*</span></label>
              <input type="number" className="input" min={2000} max={new Date().getFullYear() + 1}
                value={form.year} onChange={e => set('year', parseInt(e.target.value))} />
            </div>
            <div>
              <label className="label">Color <span className="text-red-500">*</span></label>
              <input type="text" className="input" placeholder="e.g. Pearl White"
                value={form.color} onChange={e => set('color', e.target.value)} />
            </div>
          </div>

          {/* Type & Seats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Vehicle Type</label>
              <select className="input" value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>
                {VEHICLE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Total Seats <span className="text-red-500">*</span></label>
              <input type="number" className="input" min={2} max={9}
                value={form.total_seats} onChange={e => set('total_seats', parseInt(e.target.value))} />
              <p className="text-xs text-gray-400 mt-1">Including driver's seat</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting ? <Spinner size="sm" /> : <CheckCircle size={16} />}
              {submitting ? 'Saving…' : (vehicle ? 'Update Vehicle' : 'Add Vehicle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteDialog({ vehicle, onConfirm, onCancel, deleting }) {
  if (!vehicle) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete Vehicle?</h3>
        <p className="text-sm text-gray-500 mb-1">
          <strong>{vehicle.make} {vehicle.model}</strong>
        </p>
        <p className="text-xs text-gray-400 mb-6">{vehicle.registration_number} · This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="btn-danger flex-1 flex items-center justify-center gap-2"
          >
            {deleting ? <Spinner size="sm" /> : null}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function VehicleCard({ vehicle, onEdit, onDelete }) {
  const id = vehicle.id || vehicle._id;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Vehicle Image */}
      {vehicle.image_url ? (
        <img
          src={`${API_BASE}${vehicle.image_url}`}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-44 object-cover"
        />
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <Car size={48} className="text-gray-300" />
        </div>
      )}

      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base">{vehicle.make} {vehicle.model}</h3>
            <p className="text-xs font-mono text-gray-500 mt-0.5 tracking-wider">{vehicle.registration_number}</p>
          </div>
          <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
            {vehicle.vehicle_type}
          </span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <p className="text-xs text-gray-400">Year</p>
            <p className="text-sm font-semibold text-gray-800">{vehicle.year}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <p className="text-xs text-gray-400">Color</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{vehicle.color}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <p className="text-xs text-gray-400">Seats</p>
            <p className="text-sm font-semibold text-gray-800">{vehicle.total_seats}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(vehicle)}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2"
          >
            <Edit2 size={14} /> Edit
          </button>
          <button
            onClick={() => onDelete(vehicle)}
            className="btn-danger flex-1 flex items-center justify-center gap-2 text-sm py-2"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await vehicleApi.list();
      setVehicles(res.data?.vehicles || res.data || []);
    } catch {
      setError('Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleSaved = () => {
    setSuccess('Vehicle saved successfully!');
    fetchVehicles();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const id = deleteTarget.id || deleteTarget._id;
      await vehicleApi.delete(id);
      setSuccess('Vehicle deleted.');
      setDeleteTarget(null);
      fetchVehicles();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete vehicle.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const openAdd = () => { setEditVehicle(null); setModalOpen(true); };
  const openEdit = (v) => { setEditVehicle(v); setModalOpen(true); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Vehicles</h1>
          <p className="text-gray-500 text-sm mt-1">
            {vehicles.length > 0 ? `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} registered` : 'Manage your registered vehicles.'}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles added yet"
          description="Add your first vehicle to start offering rides to passengers."
          action={{ label: 'Add Vehicle', onClick: openAdd }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map(v => (
            <VehicleCard
              key={v.id || v._id}
              vehicle={v}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <VehicleModal
        isOpen={modalOpen}
        vehicle={editVehicle}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      <DeleteDialog
        vehicle={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        deleting={deleting}
      />
    </div>
  );
}
