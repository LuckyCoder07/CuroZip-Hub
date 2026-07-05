import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/shared/ToastContext';
import { User, Phone, Mail, MapPin, Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const ProfilePage = () => {
  const { user, token, hubName, login } = useAuth();
  const { addToast } = useToast();

  const isHubManager = user?.role === 'hub_manager';
  const displayRole = (user?.role || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const avatarColor = isHubManager ? '#f97316' : '#22c55e';

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const userId = user?.id || user?._id;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return addToast('Name is required', 'error');
    setSavingProfile(true);
    try {
      await axios.put(
        `${API}/users/${userId}`,
        { name: profileForm.name, phone: profileForm.phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('Profile updated successfully', 'success');
      // Re-fetch user data to update context
      const me = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      login(token, me.data.user || me.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) return setPasswordError('Current password is required');
    if (newPassword.length < 8) return setPasswordError('New password must be at least 8 characters');
    if (newPassword !== confirmPassword) return setPasswordError('Passwords do not match');

    setSavingPassword(true);
    try {
      await axios.put(
        `${API}/users/${userId}/reset-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('Password updated successfully', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const inputCls = "w-full bg-[#0a0e1a] border border-cz-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-cz-text-secondary focus:outline-none focus:border-cz-accent-orange transition-colors";
  const readonlyCls = "w-full bg-[#0a0e1a]/60 border border-cz-border/50 rounded-lg px-3 py-2.5 text-sm text-cz-text-secondary cursor-not-allowed";
  const labelCls = "block text-cz-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5";

  return (
    <div className="max-w-[700px] mx-auto space-y-6">
      {/* Avatar / Header Card */}
      <div className="bg-cz-card-bg border border-cz-border rounded-2xl p-6 flex items-center gap-5">
        <div style={{ background: avatarColor + '22', border: `2px solid ${avatarColor}`, borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: avatarColor, fontWeight: 800, fontSize: 28, letterSpacing: '-1px' }}>{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-2xl truncate">{user?.name || '—'}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span style={{ background: avatarColor + '22', color: avatarColor, border: `1px solid ${avatarColor}55`, padding: '2px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              {displayRole}
            </span>
            {hubName && (
              <span className="text-cz-text-secondary text-sm flex items-center gap-1">
                <MapPin size={13} /> {hubName}
              </span>
            )}
          </div>
          <p className="text-cz-text-secondary text-sm mt-1">{user?.email}</p>
        </div>
      </div>

      <hr className="border-cz-border" />

      {/* Two forms side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Profile Info */}
        <div className="bg-cz-card-bg border border-cz-border rounded-2xl p-6">
          <h2 className="text-white font-bold text-base mb-5 flex items-center gap-2">
            <User size={18} className="text-cz-accent-orange" /> Profile Info
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Your full name"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone Number</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="e.g. +91 9876543210"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <div className={readonlyCls}>{user?.email || '—'}</div>
              <p className="text-cz-text-secondary text-xs mt-1">Email cannot be changed</p>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-cz-accent-orange hover:bg-[#ea6c0a] disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
            >
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : null}
              Save Profile
            </button>
          </form>
        </div>

        {/* Right: Change Password */}
        <div className="bg-cz-card-bg border border-cz-border rounded-2xl p-6">
          <h2 className="text-white font-bold text-base mb-5 flex items-center gap-2">
            <Shield size={18} className="text-cz-accent-orange" /> Change Password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2">
                {passwordError}
              </div>
            )}
            {[
              { label: 'Current Password', key: 'currentPassword', show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
              { label: 'New Password', key: 'newPassword', show: showNew, toggle: () => setShowNew(!showNew) },
              { label: 'Confirm New Password', key: 'confirmPassword', show: showConfirm, toggle: () => setShowConfirm(!showConfirm) }
            ].map(({ label, key, show, toggle }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={passwordForm[key]}
                    onChange={e => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                    placeholder="••••••••"
                    className={inputCls + ' pr-10'}
                  />
                  <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-cz-text-secondary hover:text-white">
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
            <p className="text-cz-text-secondary text-xs">Minimum 8 characters required</p>
            <button
              type="submit"
              disabled={savingPassword}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-cz-accent-orange hover:bg-[#ea6c0a] disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
            >
              {savingPassword ? <Loader2 size={16} className="animate-spin" /> : null}
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
