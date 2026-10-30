import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Car, ChevronRight, ChevronLeft,
  Upload, CheckCircle, AlertCircle, Info, Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { driverApi } from '../api/index.js';
import { Spinner } from '../components/ui.jsx';

const STEPS = [
  { id: 1, label: 'Documents',       icon: FileText },
  { id: 2, label: 'Vehicle Details', icon: Car },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const done   = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200'
                : active ? 'border-primary-600 text-primary-600 bg-primary-50'
                : 'border-gray-200 text-gray-300 bg-white'
              }`}>
                {done ? <CheckCircle size={20} /> : <Icon size={20} />}
              </div>
              <span className={`text-xs mt-1.5 font-semibold ${
                active ? 'text-primary-600' : done ? 'text-primary-400' : 'text-gray-300'
              }`}>{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-24 h-0.5 mb-5 mx-3 transition-colors ${done ? 'bg-primary-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DropZone({ label, name, accept, onChange, file, required, hint }) {
  const inputRef = useRef(null);
  return (
    <div>
      <label className="label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 cursor-pointer text-center transition-all ${
          file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-200 hover:border-primary-400 hover:bg-primary-50'
        }`}
      >
        {file ? (
          <div className="flex items-center justify-center gap-2 text-green-700">
            <CheckCircle size={18} />
            <span className="text-sm font-medium truncate max-w-xs">{file.name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <Upload size={22} />
            <span className="text-sm font-medium">Click to upload</span>
            <span className="text-xs">{hint || accept}</span>
          </div>
        )}
        <input ref={inputRef} type="file" name={name} accept={accept} onChange={onChange} className="hidden" />
      </div>
    </div>
  );
}

export default function DriverRegisterPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — Documents
  const [licenceNumber, setLicenceNumber]   = useState('');
  const [licenceDoc, setLicenceDoc]         = useState(null);
  const [rcDoc, setRcDoc]                   = useState(null);

  // Step 2 — Vehicle
  const [vehicle, setVehicle] = useState({
    registration_number: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vehicle_type: 'car',
    total_seats: 4,
  });
  const [vehicleImage, setVehicleImage]         = useState(null);
  const [vehicleImagePreview, setVehicleImagePreview] = useState(null);

  // If user is already a driver, redirect immediately
  useEffect(() => {
    if (user?.is_driver) {
      navigate('/driver/dashboard', { replace: true });
    }
  }, [user?.is_driver, navigate]);

  const setV = (key, val) => setVehicle(v => ({ ...v, [key]: val }));

  const validateStep1 = () => {
    if (!licenceNumber.trim()) return 'Driving Licence Number is required.';
    return '';
  };

  const validateStep2 = () => {
    if (!vehicle.registration_number.trim()) return 'Registration number is required.';
    if (!vehicle.make.trim()) return 'Vehicle make is required.';
    if (!vehicle.model.trim()) return 'Vehicle model is required.';
    if (!vehicle.color.trim()) return 'Vehicle color is required.';
    if (!vehicle.year || vehicle.year < 2000 || vehicle.year > new Date().getFullYear() + 1)
      return 'Enter a valid vehicle year (2000 or later).';
    if (!vehicle.total_seats || vehicle.total_seats < 2 || vehicle.total_seats > 9)
      return 'Total seats must be between 2 and 9.';
    return '';
  };

  const handleNext = () => {
    setError('');
    const err = step === 1 ? validateStep1() : '';
    if (err) { setError(err); return; }
    setStep(s => s + 1);
  };

  const handleBack = () => { setError(''); setStep(s => s - 1); };

  const handleVehicleImageChange = (e) => {
    const file = e.target.files[0] || null;
    setVehicleImage(file);
    setVehicleImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async () => {
    setError('');
    const err = validateStep2();
    if (err) { setError(err); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('licence_number', licenceNumber.trim());
      if (licenceDoc)   fd.append('licence_document', licenceDoc);
      if (rcDoc)        fd.append('rc_document', rcDoc);
      fd.append('registration_number', vehicle.registration_number.trim().toUpperCase());
      fd.append('make',          vehicle.make.trim());
      fd.append('model',         vehicle.model.trim());
      fd.append('year',          vehicle.year);
      fd.append('color',         vehicle.color.trim());
      fd.append('vehicle_type',  vehicle.vehicle_type);
      fd.append('total_seats',   vehicle.total_seats);
      if (vehicleImage) fd.append('vehicle_image', vehicleImage);

      await driverApi.register(fd);
      await refreshUser();
      // useEffect will navigate when user.is_driver becomes true
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white mb-5 shadow-lg shadow-primary-200">
            <Car size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Become a Driver</h1>
          <p className="text-gray-500 mt-2">
            Complete the {STEPS.length}-step registration to start offering rides on WayShare.
          </p>
        </div>

        <StepIndicator current={step} />

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-8">

            {/* ── Step 1: Documents ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Your Documents</h2>
                  <p className="text-gray-500 text-sm mt-1">Upload your driving licence and vehicle RC document.</p>
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex gap-3 text-sm text-blue-700">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <p>
                    Documents are stored securely and are <strong>not independently verified</strong> by
                    WayShare. Uploading confirms your intention to drive responsibly.
                  </p>
                </div>

                <div>
                  <label className="label">
                    Driving Licence Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input uppercase tracking-widest"
                    placeholder="e.g. MH0120200012345"
                    value={licenceNumber}
                    onChange={e => setLicenceNumber(e.target.value.toUpperCase())}
                  />
                  <p className="text-xs text-gray-400 mt-1">As printed on your driving licence.</p>
                </div>

                <DropZone
                  label="Licence Document"
                  name="licence_document"
                  accept="image/*, .pdf"
                  hint="Image or PDF"
                  file={licenceDoc}
                  onChange={e => setLicenceDoc(e.target.files[0] || null)}
                />

                <DropZone
                  label="Vehicle RC Document"
                  name="rc_document"
                  accept="image/*, .pdf"
                  hint="Registration Certificate — image or PDF"
                  file={rcDoc}
                  onChange={e => setRcDoc(e.target.files[0] || null)}
                />

                <div className="rounded-xl bg-green-50 border border-green-100 p-4 flex gap-3 text-sm text-green-700">
                  <Shield size={16} className="shrink-0 mt-0.5" />
                  <p>Your documents are encrypted and accessible only to WayShare support.</p>
                </div>
              </div>
            )}

            {/* ── Step 2: Vehicle Details ── */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Vehicle Details</h2>
                  <p className="text-gray-500 text-sm mt-1">Tell passengers about the vehicle they'll be riding in.</p>
                </div>

                {/* Registration */}
                <div>
                  <label className="label">Registration Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="input uppercase tracking-widest"
                    placeholder="e.g. MH01AB1234"
                    value={vehicle.registration_number}
                    onChange={e => setV('registration_number', e.target.value.toUpperCase())}
                  />
                </div>

                {/* Make & Model */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Make <span className="text-red-500">*</span></label>
                    <input type="text" className="input" placeholder="e.g. Maruti Suzuki"
                      value={vehicle.make} onChange={e => setV('make', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Model <span className="text-red-500">*</span></label>
                    <input type="text" className="input" placeholder="e.g. Swift"
                      value={vehicle.model} onChange={e => setV('model', e.target.value)} />
                  </div>
                </div>

                {/* Year & Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Year <span className="text-red-500">*</span></label>
                    <input type="number" className="input" min={2000} max={new Date().getFullYear() + 1}
                      value={vehicle.year} onChange={e => setV('year', parseInt(e.target.value))} />
                  </div>
                  <div>
                    <label className="label">Color <span className="text-red-500">*</span></label>
                    <input type="text" className="input" placeholder="e.g. Pearl White"
                      value={vehicle.color} onChange={e => setV('color', e.target.value)} />
                  </div>
                </div>

                {/* Type & Seats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Vehicle Type</label>
                    <select className="input" value={vehicle.vehicle_type} onChange={e => setV('vehicle_type', e.target.value)}>
                      <option value="car">Car</option>
                      <option value="suv">SUV</option>
                      <option value="van">Van</option>
                      <option value="bike">Bike</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Total Seats <span className="text-red-500">*</span></label>
                    <input type="number" className="input" min={2} max={9}
                      value={vehicle.total_seats}
                      onChange={e => setV('total_seats', parseInt(e.target.value))} />
                    <p className="text-xs text-gray-400 mt-1">Including driver's seat</p>
                  </div>
                </div>

                {/* Vehicle Photo */}
                <div>
                  <label className="label">
                    Vehicle Photo <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div
                    onClick={() => document.getElementById('veh-img-inp').click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors text-center"
                  >
                    {vehicleImagePreview ? (
                      <img
                        src={vehicleImagePreview}
                        alt="Vehicle preview"
                        className="mx-auto h-36 w-auto rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-gray-400 py-4">
                        <Upload size={24} />
                        <span className="text-sm font-medium">Click to upload vehicle photo</span>
                        <span className="text-xs">JPEG, PNG or WebP</span>
                      </div>
                    )}
                    <input
                      id="veh-img-inp"
                      type="file"
                      accept="image/*"
                      onChange={handleVehicleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center px-8 py-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            {step > 1 ? (
              <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length ? (
              <button onClick={handleNext} className="btn-primary flex items-center gap-2">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex items-center gap-2 min-w-44 justify-center"
              >
                {submitting
                  ? <><Spinner size="sm" /> Registering…</>
                  : <><CheckCircle size={16} /> Register as Driver</>
                }
              </button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          By registering as a driver, you agree to drive responsibly and comply with all applicable traffic laws.
        </p>
      </div>
    </div>
  );
}
