'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, RotateCcw,
  Clock, Activity, UserCircle, Package, AlertTriangle, ChevronRight,
  TrendingUp, Zap, Target, Flame, Truck, CheckCircle2, Building, Send,
  BanknoteIcon, FileText, CheckCircle, Printer, Calendar
} from 'lucide-react';
import { stockApi, attendanceApi, goalsApi, salaryApi } from '@/lib/api';
import { formatDateTime, formatDate, formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import useAuthStore from '@/lib/authStore';
import useLanguageStore from '@/lib/languageStore';

export default function WorkerHomePage() {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const [movements, setMovements] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [urgentGoals, setUrgentGoals] = useState([]);
  const [salarySlips, setSalarySlips] = useState([]);
  const [viewSlipModal, setViewSlipModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Quick Dispatch Modal for Courier info
  const [dispatchModal, setDispatchModal] = useState({
    isOpen: false,
    goal: null,
    courierName: '',
    trackingNumber: '',
  });

  const actionCards = [
    { label: t('salary') || 'Salary Slips', icon: BanknoteIcon, color: 'bg-emerald-50 text-emerald-800 border-emerald-200', href: '/salary' },
    { label: t('attendance') || 'My Attendance', icon: UserCircle, color: 'bg-purple-50 text-purple-800 border-purple-200', href: '/attendance' },
    { label: t('timeline') || 'Goals & Timeline', icon: Target, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', href: '/goals' },
    { label: t('incoming'), icon: ArrowDownToLine, color: 'bg-teal-50 text-teal-700 border-teal-200', href: '/worker/scan?action=incoming' },
    { label: t('outgoing'), icon: ArrowUpFromLine, color: 'bg-orange-50 text-orange-700 border-orange-200', href: '/worker/scan?action=outgoing' },
    { label: t('transfer'), icon: ArrowLeftRight, color: 'bg-blue-50 text-blue-700 border-blue-200', href: '/worker/scan?action=transfer' },
  ];

  const fetchData = async (isSilent = false) => {
    try {
      const [movRes, attRes, goalsRes, salaryRes] = await Promise.all([
        stockApi.getMovements({ limit: 5 }),
        attendanceApi.getMyAttendance({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }),
        goalsApi.getAll({ limit: 10 }),
        salaryApi.getMine(),
      ]);
      setMovements(movRes.data.data || []);
      const today = new Date().toISOString().split('T')[0];
      const todayRec = (attRes.data.data || []).find((r) => r.date === today);
      setTodayAttendance(todayRec);
      setAttendanceSummary(attRes.data.summary || null);
      setSalarySlips(salaryRes.data.data || []);

      const activePendingGoals = (goalsRes.data.data || []).filter(
        (g) => g.status === 'pending' || g.status === 'ready_to_dispatch'
      );
      setUrgentGoals(activePendingGoals);
    } catch (err) {
      console.error('Worker home fetch error:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 12s live poll for cross-portal synchronization
    const interval = setInterval(() => {
      fetchData(true);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickStatusUpdate = async (goalId, newStatus, courier = '', tracking = '') => {
    setActionLoadingId(goalId);
    try {
      await goalsApi.updateStatus(goalId, {
        status: newStatus,
        courierName: courier,
        trackingNumber: tracking,
        note: `Updated directly from worker portal by ${user?.name}`,
      });
      await fetchData(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchModal.goal) return;
    await handleQuickStatusUpdate(
      dispatchModal.goal._id,
      'dispatched',
      dispatchModal.courierName,
      dispatchModal.trackingNumber
    );
    setDispatchModal({ isOpen: false, goal: null, courierName: '', trackingNumber: '' });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');
  const latestSalary = salarySlips[0] || null;

  return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{greeting} 👋</p>
          <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
          <p className="text-xs text-gray-400 capitalize">{user?.designation || user?.role} · {user?.assignedWarehouse?.name || 'Warehouse Staff'}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>

      {/* Attendance Status & Punch Card */}
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
              {todayAttendance.totalHours ? ` (${todayAttendance.totalHours} hrs)` : ''}
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

      {/* 💰 Worker's Salary Slip & Monthly Earnings Preview Card */}
      {latestSalary && (
        <div className="card p-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 border-2 border-emerald-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <BanknoteIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  My Latest Salary Slip
                </h3>
                <span className="text-xs font-semibold text-emerald-700">{latestSalary.payPeriod}</span>
              </div>
            </div>
            <StatusBadge status={latestSalary.status} className="text-[10px]" />
          </div>

          <div className="flex items-end justify-between bg-white p-3 rounded-xl border border-emerald-100">
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase">Net Take-Home Pay</div>
              <div className="text-xl font-black text-emerald-900">{formatCurrency(latestSalary.netPay)}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {latestSalary.presentDays || 0} Days Worked · {latestSalary.actualHoursWorked || 0} hrs
              </div>
            </div>

            <button
              onClick={() => setViewSlipModal(latestSalary)}
              className="btn-primary text-xs py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Payslip</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>{salarySlips.length} total slips available</span>
            <Link href="/salary" className="text-emerald-800 font-bold hover:underline flex items-center gap-0.5">
              <span>View All Past Months</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* 🚨 Urgent Dispatch Goals Alert Section */}
      {urgentGoals.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-red-700 uppercase tracking-wide flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-600 animate-pulse" />
              <span>Assigned Dispatch Goals ({urgentGoals.length})</span>
            </h2>
            <Link href="/goals" className="text-xs text-brand-700 font-semibold hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {urgentGoals.map((goal) => {
              const isOverdue = goal.isOverdue;
              const isDueSoon = goal.isDueSoon;

              return (
                <div
                  key={goal._id}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    isOverdue
                      ? 'bg-red-50/90 border-red-300 shadow-sm animate-pulse'
                      : goal.priority === 'urgent' || isDueSoon
                      ? 'bg-amber-50/90 border-amber-300 shadow-sm'
                      : 'bg-white border-brand-100 shadow-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-900">{goal.product?.name}</span>
                        {goal.priority === 'urgent' && (
                          <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <Building className="w-3 h-3 text-gray-400" />
                        Client: <strong>{goal.customer?.name}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-brand-900">
                        {goal.quantity} {goal.product?.unit || 'pcs'}
                      </span>
                      <div className="text-[10px] text-gray-400">Qty to pack</div>
                    </div>
                  </div>

                  <div className="my-2.5 flex items-center justify-between text-xs pt-1 border-t border-gray-200/60">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      {isOverdue ? (
                        <span className="text-red-700 font-bold">
                          ⚠️ Overdue by {Math.abs(goal.remainingHours || 0)} hrs!
                        </span>
                      ) : isDueSoon ? (
                        <span className="text-amber-800 font-bold">
                          ⚡ Due in {goal.remainingHours} hrs ({new Date(goal.deadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      ) : (
                        <span className="text-gray-600 font-medium">
                          Deadline: {formatDateTime(goal.deadline)}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={goal.status} className="text-[10px] py-0.5" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {goal.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleQuickStatusUpdate(goal._id, 'ready_to_dispatch')}
                          disabled={actionLoadingId === goal._id}
                          className="btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 w-full"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Mark Ready 📦</span>
                        </button>
                        <button
                          onClick={() => setDispatchModal({ isOpen: true, goal, courierName: '', trackingNumber: '' })}
                          disabled={actionLoadingId === goal._id}
                          className="btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 w-full"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch 🚚</span>
                        </button>
                      </>
                    )}

                    {goal.status === 'ready_to_dispatch' && (
                      <>
                        <button
                          onClick={() => setDispatchModal({ isOpen: true, goal, courierName: '', trackingNumber: '' })}
                          disabled={actionLoadingId === goal._id}
                          className="btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 col-span-2 w-full"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Confirm Dispatched 🚀</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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

      {/* Quick Dispatch Modal */}
      {dispatchModal.isOpen && (
        <Modal
          isOpen={dispatchModal.isOpen}
          onClose={() => setDispatchModal({ isOpen: false, goal: null, courierName: '', trackingNumber: '' })}
          title="Confirm Order Dispatch 🚚"
          size="sm"
        >
          <form onSubmit={handleDispatchSubmit} className="p-5 space-y-3.5">
            <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl">
              Dispatching <strong>{dispatchModal.goal?.quantity} {dispatchModal.goal?.product?.unit}</strong> of{' '}
              <strong>{dispatchModal.goal?.product?.name}</strong> to{' '}
              <strong>{dispatchModal.goal?.customer?.name}</strong>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Courier / Transport Name</label>
              <input
                type="text"
                placeholder="e.g. Blue Dart / Delivery Van"
                value={dispatchModal.courierName}
                onChange={(e) => setDispatchModal({ ...dispatchModal, courierName: e.target.value })}
                className="input w-full text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Tracking # / Vehicle Number</label>
              <input
                type="text"
                placeholder="e.g. BD-10023 or MH-12-DE-1001"
                value={dispatchModal.trackingNumber}
                onChange={(e) => setDispatchModal({ ...dispatchModal, trackingNumber: e.target.value })}
                className="input w-full text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDispatchModal({ isOpen: false, goal: null, courierName: '', trackingNumber: '' })}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs bg-blue-600 hover:bg-blue-700"
              >
                Mark Dispatched Now
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Itemized Worker Payslip Modal */}
      {viewSlipModal && (
        <Modal
          isOpen={Boolean(viewSlipModal)}
          onClose={() => setViewSlipModal(null)}
          title={`Salary Slip — ${viewSlipModal.payPeriod}`}
          size="lg"
        >
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{viewSlipModal.employee?.name}</h3>
                <p className="text-xs text-gray-500 capitalize">{viewSlipModal.employee?.designation || viewSlipModal.employee?.role}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={viewSlipModal.status} />
                <div className="text-[10px] text-gray-400 mt-1">
                  Generated: {new Date(viewSlipModal.generatedAt || viewSlipModal.createdAt).toLocaleDateString('en-IN')}
                </div>
              </div>
            </div>

            {/* Attendance & Shift Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <span className="text-blue-600 block text-[10px] uppercase font-bold">Days Worked</span>
                <span className="font-extrabold text-blue-900 text-sm">{viewSlipModal.presentDays || 0} Full / {viewSlipModal.halfDays || 0} Half</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <span className="text-emerald-600 block text-[10px] uppercase font-bold">Hours Worked</span>
                <span className="font-extrabold text-emerald-900 text-sm">{viewSlipModal.actualHoursWorked || 0} hrs</span>
              </div>
              <div className="p-2.5 bg-purple-50 rounded-xl">
                <span className="text-purple-600 block text-[10px] uppercase font-bold">Rate</span>
                <span className="font-extrabold text-purple-900 text-sm">{formatCurrency(viewSlipModal.dailyRate || 0)}/d</span>
              </div>
            </div>

            {/* Earnings and Deductions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 space-y-1.5">
                <div className="font-bold text-emerald-900 pb-1 border-b border-emerald-200">Earnings</div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Basic Pay:</span>
                  <span className="font-semibold">{formatCurrency(viewSlipModal.earnings?.basic || 0)}</span>
                </div>
                {viewSlipModal.earnings?.hra > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">HRA:</span>
                    <span className="font-semibold">{formatCurrency(viewSlipModal.earnings.hra)}</span>
                  </div>
                )}
                {viewSlipModal.earnings?.allowances > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Allowances:</span>
                    <span className="font-semibold">{formatCurrency(viewSlipModal.earnings.allowances)}</span>
                  </div>
                )}
                {viewSlipModal.earnings?.overtime > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Overtime ({viewSlipModal.overtimeHours || 0}h):</span>
                    <span>+{formatCurrency(viewSlipModal.earnings.overtime)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-emerald-900 pt-1 border-t border-emerald-200">
                  <span>Gross Earnings:</span>
                  <span>{formatCurrency(viewSlipModal.grossEarnings)}</span>
                </div>
              </div>

              <div className="bg-red-50/60 p-3.5 rounded-xl border border-red-100 space-y-1.5">
                <div className="font-bold text-red-900 pb-1 border-b border-red-200">Deductions</div>
                {viewSlipModal.deductions?.pf > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provident Fund (PF):</span>
                    <span className="font-semibold text-red-700">-{formatCurrency(viewSlipModal.deductions.pf)}</span>
                  </div>
                )}
                {viewSlipModal.deductions?.unpaidLeaveDeduction > 0 && (
                  <div className="flex justify-between text-red-700">
                    <span>Unpaid Leaves / Absent:</span>
                    <span>-{formatCurrency(viewSlipModal.deductions.unpaidLeaveDeduction)}</span>
                  </div>
                )}
                {viewSlipModal.deductions?.shiftShortfallDeduction > 0 && (
                  <div className="flex justify-between text-red-700">
                    <span>Early Leave / Shortfall ({viewSlipModal.shortfallHours || 0}h):</span>
                    <span>-{formatCurrency(viewSlipModal.deductions.shiftShortfallDeduction)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-red-900 pt-1 border-t border-red-200">
                  <span>Total Deductions:</span>
                  <span>-{formatCurrency(viewSlipModal.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Pay */}
            <div className="p-4 bg-brand-800 text-white rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-white/70 uppercase tracking-wider font-bold">Net Salary Disbursed</div>
                <div className="text-2xl font-black">{formatCurrency(viewSlipModal.netPay)}</div>
              </div>
              <button
                onClick={() => window.print()}
                className="btn-secondary text-xs bg-white/20 hover:bg-white/30 text-white border-0 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Payslip</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
