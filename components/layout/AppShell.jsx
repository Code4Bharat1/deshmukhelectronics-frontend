'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Bell, X } from 'lucide-react';
import useAuthStore from '../../lib/authStore';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { notificationsApi } from '../../lib/api';

import LanguageSwitch from '../ui/LanguageSwitch';

export default function AppShell({ children }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, initialize, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  // Poll notifications every 30s
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = async () => {
      try {
        const res = await notificationsApi.getAll({ unreadOnly: 'true' });
        setUnreadCount(res.data.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed inset-y-0 left-0 z-40 shadow-sidebar">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute inset-y-0 left-0 w-72 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="md:ml-64 min-h-screen flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button
            id="open-sidebar-btn"
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost btn-icon min-h-0 p-2"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-700 flex items-center justify-center">
              <span className="text-white text-xs">⚡</span>
            </div>
            <span className="font-bold text-sm text-gray-900">Deshmukh</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <button
              onClick={() => router.push('/notifications')}
              className="btn-ghost btn-icon min-h-0 p-2 relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100">
          <div className="text-xs text-gray-400 font-medium">
            Deshmukh Electronics Warehouse & Team System
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitch />
            <button
              onClick={() => router.push('/notifications')}
              className="relative btn-ghost btn-icon min-h-0 p-2 text-gray-500 hover:text-brand-700"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 text-sm border-l border-gray-100 pl-3">
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="font-medium text-gray-700">{user?.name}</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
