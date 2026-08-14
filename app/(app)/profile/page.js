'use client';
import { useState, useEffect } from 'react';
import { User, Lock, Mail, Phone, ShieldCheck, Warehouse, BanknoteIcon, Save, KeyRound } from 'lucide-react';
import useAuthStore from '@/lib/authStore';
import { authApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { getRoleLabel, getRoleBadgeColor, formatCurrency } from '@/lib/utils';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await authApi.updateProfile(profileForm);
      updateUser(res.data.data);
      toast('Profile updated successfully', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast('New password must be at least 6 characters', 'error');
      return;
    }
    setChangingPass(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast('Password changed successfully', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="text-gray-500 text-sm">Account details and security settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="card text-center p-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-24 h-24 rounded-3xl bg-brand-700 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-brand-700/20">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            <span className={`badge ${getRoleBadgeColor(user?.role)}`}>
              {getRoleLabel(user?.role)}
            </span>
          </div>

          <div className="w-full border-t border-gray-100 pt-4 text-left space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-400">Designation:</span>
              <span className="font-semibold text-gray-800">{user?.designation || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Warehouse:</span>
              <span className="font-semibold text-gray-800">{user?.assignedWarehouse?.name || 'All Warehouses'}</span>
            </div>
          </div>
        </div>

        {/* Right Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="card">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-700" /> Personal Information
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    className="input"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary btn-sm flex items-center gap-1.5" disabled={updatingProfile}>
                <Save className="w-3.5 h-3.5" />
                {updatingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="card">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-700" /> Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="form-group">
                <label className="label">Current Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-secondary btn-sm flex items-center gap-1.5" disabled={changingPass}>
                <Lock className="w-3.5 h-3.5" />
                {changingPass ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
