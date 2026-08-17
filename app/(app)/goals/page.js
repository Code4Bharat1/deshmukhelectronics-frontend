'use client';
import { useState, useEffect } from 'react';
import {
  Target, Plus, Clock, AlertTriangle, CheckCircle, Package,
  Truck, CheckCircle2, ChevronRight, RefreshCw, Search,
  Building, User, Flame, MessageSquare, History, Trash2
} from 'lucide-react';
import { goalsApi, warehousesApi } from '../../../lib/api';
import useAuthStore from '../../../lib/authStore';
import useLanguageStore from '../../../lib/languageStore';
import AssignGoalModal from '../../../components/goals/AssignGoalModal';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { formatDateTime } from '../../../lib/utils';

export default function GoalsTimelinePage() {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();

  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    ready_to_dispatch: 0,
    dispatched: 0,
    delivered: 0,
    urgentAlerts: 0,
    overdue: 0,
    dueSoon: 0,
  });
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Status Action Modal State
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    goal: null,
    targetStatus: '',
    note: '',
    courierName: '',
    trackingNumber: '',
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Selected Timeline Details Modal
  const [viewHistoryGoal, setViewHistoryGoal] = useState(null);

  const isManagerOrAdmin = user?.role === 'owner_admin' || user?.role === 'manager';

  const fetchGoals = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = {};
      if (activeTab === 'urgent') {
        params.urgentOnly = 'true';
      } else if (activeTab !== 'all') {
        params.status = activeTab;
      }
      if (selectedWarehouse !== 'all') {
        params.warehouse = selectedWarehouse;
      }
      if (search) {
        params.search = search;
      }

      const res = await goalsApi.getAll(params);
      setGoals(res.data.data || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    warehousesApi.getAll().then((res) => {
      setWarehouses(res.data.data || []);
    }).catch(() => {});

    const interval = setInterval(() => {
      fetchGoals(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab, selectedWarehouse, search]);

  const openStatusAction = (goal, targetStatus) => {
    setStatusModal({
      isOpen: true,
      goal,
      targetStatus,
      note: '',
      courierName: goal.courierName || '',
      trackingNumber: goal.trackingNumber || '',
    });
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModal.goal || !statusModal.targetStatus) return;

    setUpdatingStatus(true);
    try {
      await goalsApi.updateStatus(statusModal.goal._id, {
        status: statusModal.targetStatus,
        note: statusModal.note,
        courierName: statusModal.courierName,
        trackingNumber: statusModal.trackingNumber,
      });

      setStatusModal({ isOpen: false, goal: null, targetStatus: '', note: '', courierName: '', trackingNumber: '' });
      fetchGoals(true);
    } catch (err) {
      console.error('Update status error:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!confirm('Are you sure you want to delete this dispatch goal?')) return;
    try {
      await goalsApi.delete(id);
      fetchGoals(true);
    } catch (err) {
      alert('Failed to delete goal');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <Target className="w-7 h-7 text-brand-700" />
              Dispatch Goals & Timeline
            </h1>
            <span className="bg-brand-100 text-brand-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Live Tracker
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            Assign dispatch targets, monitor live worker milestones, and manage urgent customer orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchGoals(true)}
            className="btn-secondary btn-icon text-gray-500 hover:text-brand-700 p-2"
            title="Refresh Goals"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          </button>

          {isManagerOrAdmin && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="btn-primary flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Assign New Goal</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab('all')}
          className={`card cursor-pointer transition-all hover:scale-[1.02] ${
            activeTab === 'all' ? 'ring-2 ring-brand-700 bg-white' : 'bg-white/80'
          }`}
        >
          <div className="text-xs text-gray-500 font-semibold uppercase">Total Goals</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">All active & completed</div>
        </div>

        <div
          onClick={() => setActiveTab('urgent')}
          className={`card cursor-pointer transition-all hover:scale-[1.02] ${
            activeTab === 'urgent'
              ? 'ring-2 ring-red-500 bg-red-50/70 border-red-200'
              : stats.urgentAlerts > 0
              ? 'bg-red-50/40 border-red-200 animate-pulse'
              : 'bg-white'
          }`}
        >
          <div className="text-xs text-red-700 font-bold uppercase flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-red-600" />
            Urgent Alerts
          </div>
          <div className="text-2xl font-black text-red-600 mt-1">{stats.urgentAlerts}</div>
          <div className="text-[11px] text-red-600/80 font-medium mt-0.5">
            {stats.overdue > 0 ? `${stats.overdue} overdue!` : 'Due < 24 hrs'}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('ready_to_dispatch')}
          className={`card cursor-pointer transition-all hover:scale-[1.02] ${
            activeTab === 'ready_to_dispatch' ? 'ring-2 ring-indigo-600 bg-indigo-50/40' : 'bg-white'
          }`}
        >
          <div className="text-xs text-indigo-700 font-semibold uppercase flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-indigo-600" />
            Ready for Dock
          </div>
          <div className="text-2xl font-bold text-indigo-800 mt-1">{stats.ready_to_dispatch}</div>
          <div className="text-[11px] text-indigo-600/80 mt-0.5">Packed & verified</div>
        </div>

        <div
          onClick={() => setActiveTab('dispatched')}
          className={`card cursor-pointer transition-all hover:scale-[1.02] ${
            activeTab === 'dispatched' ? 'ring-2 ring-blue-600 bg-blue-50/40' : 'bg-white'
          }`}
        >
          <div className="text-xs text-blue-700 font-semibold uppercase flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            In Transit
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-1">{stats.dispatched}</div>
          <div className="text-[11px] text-blue-600/80 mt-0.5">Dispatched out</div>
        </div>

        <div
          onClick={() => setActiveTab('delivered')}
          className={`card cursor-pointer transition-all hover:scale-[1.02] ${
            activeTab === 'delivered' ? 'ring-2 ring-emerald-600 bg-emerald-50/40' : 'bg-white'
          }`}
        >
          <div className="text-xs text-emerald-700 font-semibold uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Delivered
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.delivered}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Completed orders</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          {[
            { id: 'all', label: 'All Goals' },
            { id: 'urgent', label: `🔥 Urgent (${stats.urgentAlerts})` },
            { id: 'pending', label: `Pending (${stats.pending})` },
            { id: 'ready_to_dispatch', label: `Ready (${stats.ready_to_dispatch})` },
            { id: 'dispatched', label: `In Transit (${stats.dispatched})` },
            { id: 'delivered', label: `Delivered (${stats.delivered})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? tab.id === 'urgent'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-brand-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product, client, courier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 pr-3 py-1.5 text-xs w-full"
            />
          </div>

          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="input py-1.5 text-xs"
          >
            <option value="all">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Goals Timeline List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse space-y-4">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-16 bg-gray-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="card p-12 text-center space-y-3 bg-white">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto text-2xl">
            🎯
          </div>
          <h3 className="text-lg font-bold text-gray-900">No dispatch goals found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {activeTab === 'urgent'
              ? 'Great news! There are no overdue or urgent orders pending right now.'
              : 'No goals match the selected filter criteria. Click "Assign New Goal" to dispatch products.'}
          </p>
          {isManagerOrAdmin && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Assign First Goal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const isCompletedOrDispatched = ['dispatched', 'delivered', 'cancelled'].includes(goal.status);
            const isOverdue = goal.isOverdue;
            const isDueSoon = goal.isDueSoon;

            const stages = [
              { key: 'pending', label: 'Goal Assigned', icon: Target },
              { key: 'ready_to_dispatch', label: 'Ready at Dock', icon: Package },
              { key: 'dispatched', label: 'Dispatched', icon: Truck },
              { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
            ];

            const statusIndex = stages.findIndex((s) => s.key === goal.status);
            const activeIndex = statusIndex === -1 ? 0 : statusIndex;

            return (
              <div
                key={goal._id}
                className={`card p-5 md:p-6 transition-all border-2 ${
                  isOverdue
                    ? 'border-red-300 bg-red-50/15 shadow-sm'
                    : isDueSoon || goal.priority === 'urgent'
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                {/* Top Row: Title, Priority, Customer, Warehouse, Deadline Alerts */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">{goal.title}</h3>

                      {goal.priority === 'urgent' && (
                        <span className="badge bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 font-bold">
                          <Flame className="w-3 h-3 text-red-600" />
                          URGENT
                        </span>
                      )}
                      {goal.priority === 'high' && (
                        <span className="badge bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                          High Priority
                        </span>
                      )}

                      <StatusBadge status={goal.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-gray-400" />
                        Client: <strong className="text-gray-800">{goal.customer?.name}</strong> ({goal.customer?.city || 'Pune'})
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        Warehouse: <strong className="text-gray-800">{goal.warehouse?.name}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        Assigned by: <span className="text-gray-700">{goal.assignedBy?.name}</span>
                      </span>
                    </div>
                  </div>

                  {/* Deadline & Urgency Display */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                    {!isCompletedOrDispatched ? (
                      isOverdue ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-xl border border-red-300 font-bold text-xs animate-pulse">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>OVERDUE by {Math.abs(goal.remainingHours || 0)} hrs!</span>
                        </div>
                      ) : isDueSoon ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-900 rounded-xl border border-amber-300 font-bold text-xs">
                          <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Due in {goal.remainingHours} hrs</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs">
                          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>Target: {formatDateTime(goal.deadline)}</span>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          {goal.status === 'dispatched' ? 'Dispatched (In Transit)' : 'Delivered to Customer'}
                        </span>
                      </div>
                    )}

                    {isManagerOrAdmin && (
                      <button
                        onClick={() => handleDeleteGoal(goal._id)}
                        className="btn-ghost btn-icon p-1.5 text-gray-400 hover:text-red-600 min-h-0"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Product & Quantity Callout */}
                <div className="my-4 p-3 bg-gray-50 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-sm">
                      📦
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{goal.product?.name}</div>
                      <div className="text-gray-500">
                        SKU: <span className="font-mono">{goal.product?.sku}</span> · Current Warehouse Stock: {goal.product?.currentStock} {goal.product?.unit}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-gray-400 font-semibold uppercase">Quantity to Send</div>
                      <div className="text-base font-black text-brand-900">
                        {goal.quantity} {goal.product?.unit || 'pcs'}
                      </div>
                    </div>

                    {goal.assignedWorkers?.length > 0 && (
                      <div className="border-l border-gray-200 pl-3">
                        <div className="text-[10px] text-gray-400 font-semibold uppercase">Assigned Workers</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {goal.assignedWorkers.map((w) => (
                            <span
                              key={w._id}
                              className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[11px] font-medium text-gray-700"
                            >
                              {w.name?.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Instructions */}
                {goal.notes && (
                  <div className="mb-4 text-xs bg-amber-50/60 border border-amber-100 text-amber-900 p-2.5 rounded-lg flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Instructions:</strong> {goal.notes}</span>
                  </div>
                )}

                {/* Courier / Tracking */}
                {goal.trackingNumber && (
                  <div className="mb-4 text-xs bg-blue-50 border border-blue-100 text-blue-900 p-2.5 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span>
                        Courier: <strong>{goal.courierName || 'Standard'}</strong> | Tracking #{' '}
                        <strong className="font-mono">{goal.trackingNumber}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Stepper */}
                <div className="pt-2 pb-1">
                  <div className="grid grid-cols-4 gap-2 relative">
                    {stages.map((stage, idx) => {
                      const isPast = idx < activeIndex;
                      const isCurrent = idx === activeIndex;
                      const entry = goal.statusTimeline?.filter((t) => t.status === stage.key).pop();

                      return (
                        <div key={stage.key} className="flex flex-col items-center text-center relative group">
                          {idx < stages.length - 1 && (
                            <div
                              className={`absolute top-4 left-1/2 w-full h-1 z-0 -translate-y-1/2 ${
                                idx < activeIndex ? 'bg-emerald-500' : 'bg-gray-200'
                              }`}
                            />
                          )}

                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs z-10 transition-all ${
                              isPast
                                ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-200'
                                : isCurrent
                                ? isOverdue
                                  ? 'bg-red-600 text-white shadow-md ring-4 ring-red-100 animate-pulse'
                                  : 'bg-brand-700 text-white shadow-md ring-4 ring-brand-100'
                                : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}
                          >
                            {isPast ? <CheckCircle className="w-4 h-4" /> : <stage.icon className="w-3.5 h-3.5" />}
                          </div>

                          <div className="mt-2 space-y-0.5">
                            <div className={`text-[11px] font-bold ${isCurrent ? 'text-brand-900' : isPast ? 'text-gray-800' : 'text-gray-400'}`}>
                              {stage.label}
                            </div>
                            {entry && (
                              <div className="text-[10px] text-gray-500">
                                <div>{formatDateTime(entry.timestamp)}</div>
                                <div className="text-gray-400 truncate max-w-[100px]">
                                  by {entry.changedBy?.name?.split(' ')[0] || 'Staff'}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setViewHistoryGoal(goal)}
                    className="text-xs text-brand-700 font-semibold hover:underline flex items-center gap-1.5 min-h-0 p-0"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View Timeline Log ({goal.statusTimeline?.length || 1} events)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {goal.status === 'pending' && (
                      <button
                        onClick={() => openStatusAction(goal, 'ready_to_dispatch')}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Mark Ready to Dispatch</span>
                      </button>
                    )}

                    {goal.status === 'ready_to_dispatch' && (
                      <button
                        onClick={() => openStatusAction(goal, 'dispatched')}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch Order Now 🚀</span>
                      </button>
                    )}

                    {goal.status === 'dispatched' && (
                      <button
                        onClick={() => openStatusAction(goal, 'delivered')}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Delivered</span>
                      </button>
                    )}

                    {goal.status === 'delivered' && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Order Fulfilled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Goal Modal */}
      <AssignGoalModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => fetchGoals(true)}
      />

      {/* Update Status Modal */}
      {statusModal.isOpen && (
        <Modal
          isOpen={statusModal.isOpen}
          onClose={() => setStatusModal({ isOpen: false, goal: null, targetStatus: '', note: '', courierName: '', trackingNumber: '' })}
          title={`Update Status: ${statusModal.targetStatus?.replace(/_/g, ' ')?.toUpperCase()}`}
          size="md"
        >
          <form onSubmit={handleStatusSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
              <div className="font-bold text-gray-900">{statusModal.goal?.title}</div>
              <div className="text-gray-500">
                Customer: <strong>{statusModal.goal?.customer?.name}</strong> · Qty: {statusModal.goal?.quantity} {statusModal.goal?.product?.unit}
              </div>
            </div>

            {statusModal.targetStatus === 'dispatched' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Courier / Transport Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Blue Dart, Delivery Van"
                    value={statusModal.courierName}
                    onChange={(e) => setStatusModal({ ...statusModal, courierName: e.target.value })}
                    className="input w-full text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Tracking / LR Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BD-882201"
                    value={statusModal.trackingNumber}
                    onChange={(e) => setStatusModal({ ...statusModal, trackingNumber: e.target.value })}
                    className="input w-full text-xs font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                Worker Comment / Note (Optional)
              </label>
              <textarea
                placeholder="e.g. Verified by QC. Loaded on delivery truck."
                value={statusModal.note}
                onChange={(e) => setStatusModal({ ...statusModal, note: e.target.value })}
                className="input w-full text-xs resize-none"
                rows="2"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModal({ isOpen: false, goal: null, targetStatus: '', note: '', courierName: '', trackingNumber: '' })}
                className="btn-secondary"
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={updatingStatus}
              >
                {updatingStatus ? 'Updating...' : 'Confirm Status Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detailed Timeline History Modal */}
      {viewHistoryGoal && (
        <Modal
          isOpen={Boolean(viewHistoryGoal)}
          onClose={() => setViewHistoryGoal(null)}
          title={`Timeline History: ${viewHistoryGoal.title}`}
          size="md"
        >
          <div className="p-6 space-y-4">
            <div className="space-y-4 relative border-l-2 border-brand-200 ml-3 pl-4">
              {viewHistoryGoal.statusTimeline?.map((item, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-brand-600 ring-4 ring-white" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900 capitalize">
                      {item.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-400">{formatDateTime(item.timestamp)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Updated by: <strong>{item.changedBy?.name || 'User'}</strong> ({item.changedBy?.role || 'Staff'})
                  </div>
                  {item.note && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mt-1 border border-gray-100">
                      "{item.note}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewHistoryGoal(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
