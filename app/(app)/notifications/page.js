'use client';
import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Package, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { notificationsApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import { formatDateTime, cn } from '../../../lib/utils';

const typeIcons = {
  low_stock: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  pending_approval: { icon: Clock, color: 'text-blue-600 bg-blue-50' },
  stock_movement: { icon: Package, color: 'text-teal-600 bg-teal-50' },
  damaged: { icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  salary: { icon: Bell, color: 'text-purple-600 bg-purple-50' },
  return: { icon: RotateCcw, color: 'text-orange-600 bg-orange-50' },
  attendance: { icon: Clock, color: 'text-green-600 bg-green-50' },
  system: { icon: Bell, color: 'text-gray-600 bg-gray-50' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getAll({ unreadOnly });
      setNotifications(res.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [unreadOnly]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast('All notifications marked as read', 'success');
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          {unreadCount > 0 && <p className="text-brand-700 text-sm font-semibold">{unreadCount} unread</p>}
        </div>
        <div className="flex gap-2">
          <button
            className={cn('btn-sm', unreadOnly ? 'btn-primary' : 'btn-secondary')}
            onClick={() => setUnreadOnly(!unreadOnly)}
          >
            {unreadOnly ? 'Show All' : 'Unread Only'}
          </button>
          {unreadCount > 0 && (
            <button className="btn-sm btn-secondary flex items-center gap-1.5" onClick={handleMarkAll}>
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="empty-state py-16">
            <div className="empty-icon"><Bell className="w-8 h-8 text-gray-300" /></div>
            <h3 className="text-gray-500 font-semibold">All caught up!</h3>
            <p className="text-gray-400 text-sm">No notifications to show</p>
          </div>
        ) : notifications.map((notif) => {
          const { icon: Icon, color } = typeIcons[notif.type] || typeIcons.system;
          return (
            <div
              key={notif._id}
              className={cn('card flex items-start gap-4 cursor-pointer hover:shadow-card-hover transition-all', !notif.isRead && 'border-l-4 border-l-brand-700')}
              onClick={() => !notif.isRead && handleMarkRead(notif._id)}
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className={cn('text-sm font-semibold text-gray-900', !notif.isRead && 'text-brand-700')}>{notif.title}</div>
                  {!notif.isRead && <div className="w-2 h-2 rounded-full bg-brand-700 shrink-0 mt-1" />}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                <div className="text-xs text-gray-400 mt-1">{formatDateTime(notif.createdAt)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
