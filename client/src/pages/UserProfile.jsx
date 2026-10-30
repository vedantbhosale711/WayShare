import { useState, useEffect } from 'react';
import { authApi } from '../api/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Alert, Spinner } from '../components/ui.jsx';
import { User, Lock, Camera, Eye, EyeOff } from 'lucide-react';

export default function UserProfile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState({ full_name: '', mobile: '', gender: '' });
  const [profilePic, setProfilePic] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', msg: '' });

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: '', msg: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    if (user) {
      setProfile({ full_name: user.full_name || '', mobile: user.mobile || '', gender: user.gender || '' });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', msg: '' });
    try {
      const fd = new FormData();
      fd.append('full_name', profile.full_name);
      fd.append('mobile', profile.mobile);
      fd.append('gender', profile.gender);
      if (profilePic) fd.append('profile_picture', profilePic);
      await authApi.updateProfile(fd);
      await refreshUser();
      setProfileMsg({ type: 'success', msg: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', msg: err.response?.data?.message || 'Update failed' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      setPwMsg({ type: 'error', msg: 'New passwords do not match' });
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwMsg({ type: 'error', msg: 'Password must be at least 8 characters' });
      return;
    }
    setPwLoading(true);
    setPwMsg({ type: '', msg: '' });
    try {
      await authApi.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwMsg({ type: 'success', msg: 'Password changed successfully!' });
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwMsg({ type: 'error', msg: err.response?.data?.message || 'Password change failed' });
    } finally {
      setPwLoading(false);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const avatarSrc = profilePreview
    || (user?.profile_picture ? `http://localhost:5000${user.profile_picture}` : null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Profile Form */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User size={18} className="text-primary-600" /> Personal Information
        </h2>

        {profileMsg.msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm border ${profileMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {profileMsg.msg}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border-4 border-white shadow">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary-700">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-primary-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-primary-700 shadow">
                <Camera size={12} />
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </label>
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user?.full_name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs mt-0.5">
                <span className={`badge ${user?.is_driver ? 'badge-green' : 'badge-blue'}`}>
                  {user?.is_driver ? '🚗 Driver' : '🧑 Passenger'}
                </span>
              </p>
            </div>
          </div>

          <div>
            <label className="label">Full Name *</label>
            <input type="text" className="input" value={profile.full_name} required
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input type="email" className="input bg-gray-50" value={user?.email || ''} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="label">Mobile Number</label>
            <input type="tel" className="input" value={profile.mobile} maxLength={10}
              onChange={e => setProfile(p => ({ ...p, mobile: e.target.value }))} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Gender is used for Women-Only ride eligibility</p>
          </div>
          <button type="submit" disabled={profileLoading} className="btn-primary flex items-center gap-2">
            {profileLoading ? <><Spinner size="sm" /> Saving...</> : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Lock size={18} className="text-primary-600" /> Change Password
        </h2>

        {pwMsg.msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm border ${pwMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {pwMsg.msg}
          </div>
        )}

        <form onSubmit={handlePwSubmit} className="space-y-4">
          {['current', 'new', 'confirm'].map(field => (
            <div key={field}>
              <label className="label capitalize">{field === 'confirm' ? 'Confirm New Password' : `${field} Password`}</label>
              <div className="relative">
                <input
                  type={showPw[field] ? 'text' : 'password'}
                  className="input pr-10"
                  required
                  placeholder="••••••••"
                  value={pwForm[field === 'confirm' ? 'confirm' : field + '_password'] ?? pwForm[field]}
                  onChange={e => setPwForm(p => ({ ...p, [field === 'confirm' ? 'confirm' : field + '_password']: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPw(s => ({ ...s, [field]: !s[field] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={pwLoading} className="btn-primary flex items-center gap-2">
            {pwLoading ? <><Spinner size="sm" /> Changing...</> : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
