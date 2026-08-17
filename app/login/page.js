'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, Lock, Mail, AlertCircle } from 'lucide-react';
import useAuthStore from '@/lib/authStore';
import useLanguageStore from '@/lib/languageStore';
import LanguageSwitch from '@/components/ui/LanguageSwitch';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, initialize, isLoading, user } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { initialize(); }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(user.role === 'worker' ? '/worker' : '/dashboard');
    }
  }, [isAuthenticated, isLoading, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please enter email and password');
      return;
    }
    setSubmitting(true);
    try {
      const loggedUser = await login(form.email, form.password);
      router.replace(loggedUser.role === 'worker' ? '/worker' : '/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Server Error');
      } else {
        setError(err.message || 'Login failed. Check credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const demoAccounts = [
    { label: 'Admin', email: 'rajiv@deshmukhelectronics.com', color: 'bg-purple-100 text-purple-800' },
    { label: 'Manager', email: 'sunita@deshmukhelectronics.com', color: 'bg-blue-100 text-blue-800' },
    { label: 'Worker', email: 'rahul@deshmukhelectronics.com', color: 'bg-gray-100 text-gray-800' },
    { label: 'Accountant', email: 'priya@deshmukhelectronics.com', color: 'bg-amber-100 text-amber-800' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left branding panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-800 via-brand-700 to-teal-600 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-xl">Deshmukh Electronics</div>
              <div className="text-white/60 text-sm">Warehouse & Team App</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Manage your<br />warehouse with<br />confidence.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Real-time inventory tracking, attendance management, and team operations — all in one place.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Products Tracked', value: '20+' },
            { label: 'Warehouses', value: '3' },
            { label: 'Team Members', value: '8' },
            { label: 'Daily Movements', value: '50+' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-4">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-white/60 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-gray-50">
        {/* Mobile header */}
        <div className="flex items-center gap-3 mb-10 md:hidden">
          <div className="w-12 h-12 rounded-2xl bg-brand-700 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-xl text-gray-900">Deshmukh Electronics</div>
            <div className="text-gray-500 text-sm">Warehouse & Team App</div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="label" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  className="input pl-10"
                  placeholder="you@deshmukhelectronics.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-0 p-0"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-btn"
              className="btn-primary w-full btn-lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-card">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 ${acc.color} min-h-0`}
                  onClick={() => setForm({ email: acc.email, password: 'password123' })}
                >
                  <span>{acc.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Password: password123</p>
          </div>

          {/* Language toggle */}
          <div className="mt-6 flex items-center justify-center">
            <LanguageSwitch />
          </div>
        </div>
      </div>
    </div>
  );
}
