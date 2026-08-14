'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, RotateCcw,
  Clock, Activity, UserCircle, Package, AlertTriangle, ChevronRight,
  TrendingUp, Zap
} from 'lucide-react';
import { stockApi, attendanceApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import useAuthStore from '@/lib/authStore';
import useLanguageStore from '@/lib/languageStore';

export default function WorkerHomePage() {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const [movements, setMovements] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  const actionCards = [
    { label: t('incoming'), icon: ArrowDownToLine, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', href: '/worker/scan?action=incoming' },
    { label: t('outgoing'), icon: ArrowUpFromLine, color: 'bg-orange-50 text-orange-700 border-orange-200', href: '/worker/scan?action=outgoing' },
    { label: t('transfer'), icon: ArrowLeftRight, color: 'bg-blue-50 text-blue-700 border-blue-200', href: '/worker/scan?action=transfer' },
    { label: t('return'), icon: RotateCcw, color: 'bg-purple-50 text-purple-700 border-purple-200', href: '/worker/scan?action=return' },
    { label: t('damaged'), icon: AlertTriangle, color: 'bg-red-50 text-red-700 border-red-200', href: '/worker/scan?action=damaged' },
    { label: t('activity'), icon: Activity, color: 'bg-gray-50 text-gray-700 border-gray-200', href: '/stock/movements' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movRes, attRes] = await Promise.all([
          stockApi.getMovements({ limit: 5 }),
          attendanceApi.getMyAttendance({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }),
        ]);
        setMovements(movRes.data.data || []);
        const today = new Date().toISOString().split('T')[0];
        const todayRec = (attRes.data.data || []).find((r) => r.date === today);
        setTodayAttendance(todayRec);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');

  return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{greeting} 👋</p>
          <h1 className="text-xl font-bold text-gray-900">{user?.name?.split(' ')[0]}</h1>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>

      {/* Attendance Status */}
      {todayAttendance ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-emerald-800">{t('punchedIn')}</div>
            <div className="text-xs text-emerald-600">
              {todayAttendance.punchInTime ? `In: ${new Date(todayAttendance.punchInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
              {todayAttendance.punchOutTime ? ` · Out: ${new Date(todayAttendance.punchOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </div>
          </div>
          <Link href="/attendance" className="text-emerald-700 hover:text-emerald-900 min-h-0 p-0">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <Link href="/attendance" className="block">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-amber-800">{t('notPunchedIn')}</div>
              <div className="text-xs text-amber-600">{t('tapToPunchIn')}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-600" />
          </div>
        </Link>
      )}

      {/* Big Scan QR Button */}
      <Link href="/worker/scan" id="scan-qr-btn">
        <div className="scan-btn w-full py-8 gap-2">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <span className="text-white text-xl font-bold">{t('scanQRCode')}</span>
          <span className="text-white/70 text-sm">{t('scanPrompt')}</span>
        </div>
      </Link>

      {/* Action Cards Grid */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{t('quickActions')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {actionCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 ${card.color} transition-all duration-150 active:scale-95 hover:shadow-md`}>
                <card.icon className="w-6 h-6" />
                <span className="text-xs font-bold text-center leading-tight">{card.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{t('myRecentActivity')}</h2>
          <Link href="/stock/movements" className="text-brand-700 text-xs font-semibold min-h-0 p-0">{t('seeAll')}</Link>
        </div>
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card animate-pulse py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : movements.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-icon">📦</div>
              <p className="text-gray-400 text-sm">No activity yet</p>
            </div>
          ) : (
            movements.map((m) => (
              <div key={m._id} className="card py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg shrink-0">
                  {m.type === 'incoming' ? '📥' : m.type === 'outgoing' ? '📤' : m.type === 'transfer' ? '🔄' : m.type === 'damaged' ? '⚠️' : '↩️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{m.product?.name || '—'}</div>
                  <div className="text-xs text-gray-500">
                    {m.quantity} {m.product?.unit || 'pcs'} · {formatDateTime(m.createdAt)}
                  </div>
                </div>
                <StatusBadge status={m.type} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
