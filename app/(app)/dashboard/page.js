'use client';
import { useState, useEffect } from 'react';
import {
  Package, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine,
  AlertTriangle, Wrench, Clock, Warehouse, CheckCircle, XCircle,
  RefreshCw, MoreVertical
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { dashboardApi, stockApi } from '../../../lib/api';
import KPICard from '../../../components/ui/KPICard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatCurrency, formatDateTime, getMovementIcon } from '../../../lib/utils';

const TEAL_COLORS = ['#0b6e7d', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const [sumRes, movRes, adjRes] = await Promise.all([
        dashboardApi.getSummary(),
        stockApi.getMovements({ limit: 8 }),
        stockApi.getAdjustments({ status: 'pending', limit: 5 }),
      ]);
      setSummary(sumRes.data.data);
      setMovements(movRes.data.data || []);
      setAdjustments(adjRes.data.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id) => {
    try {
      await stockApi.approveAdjustment(id, { comment: 'Approved from dashboard' });
      setAdjustments((prev) => prev.filter((a) => a._id !== id));
    } catch {}
  };

  const handleReject = async (id) => {
    try {
      await stockApi.rejectAdjustment(id, { comment: 'Rejected from dashboard' });
      setAdjustments((prev) => prev.filter((a) => a._id !== id));
    } catch {}
  };

  // Build 7-day chart data from API trend
  const chartData = (() => {
    if (!summary?.charts?.movementTrend) return [];
    const grouped = {};
    summary.charts.movementTrend.forEach(({ _id, total }) => {
      if (!grouped[_id.date]) grouped[_id.date] = { date: _id.date, incoming: 0, outgoing: 0 };
      grouped[_id.date][_id.type] = total;
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    }));
  })();

  const warehouseData = summary?.charts?.warehouseStock?.map((w) => ({
    name: w.name?.split('–')[0]?.trim() || w.name || 'Unknown',
    stock: w.total,
  })) || [];

  const categoryData = summary?.charts?.categoryStock?.slice(0, 6).map((c, i) => ({
    name: c._id || 'Other',
    value: c.total,
    color: TEAL_COLORS[i % TEAL_COLORS.length],
  })) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="kpi-card animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-200" />
              <div className="h-8 bg-gray-200 rounded-lg w-16 mt-2" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const kpis = summary?.kpis || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-gray-500 text-sm">Real-time inventory & operations overview</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          className="btn-secondary btn-sm flex items-center gap-1.5"
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Package} label="Total Products" value={kpis.totalProducts?.toLocaleString('en-IN')} color="teal" />
        <KPICard icon={Warehouse} label="Total Stock" value={kpis.totalStock?.toLocaleString('en-IN')} color="blue" />
        <KPICard icon={ArrowDownToLine} label="Today's Incoming" value={kpis.todayIncoming?.toLocaleString('en-IN')} color="green" />
        <KPICard icon={ArrowUpFromLine} label="Today's Outgoing" value={kpis.todayOutgoing?.toLocaleString('en-IN')} color="orange" />
        <KPICard icon={AlertTriangle} label="Low Stock Items" value={kpis.lowStockItems} color="amber" />
        <KPICard icon={Wrench} label="Damaged Stock" value={kpis.damagedItems?.toLocaleString('en-IN')} color="red" />
        <KPICard icon={Clock} label="Pending Approvals" value={kpis.pendingApprovals} color="purple" />
        <KPICard icon={Warehouse} label="Active Warehouses" value={kpis.activeWarehouses} color="teal" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line chart — 7-day movement */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Stock Movement (7 Days)</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0b6e7d" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0b6e7d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="incoming" stroke="#0b6e7d" strokeWidth={2} fill="url(#colorIn)" name="Incoming" dot={{ r: 3, fill: '#0b6e7d' }} />
              <Area type="monotone" dataKey="outgoing" stroke="#f97316" strokeWidth={2} fill="url(#colorOut)" name="Outgoing" dot={{ r: 3, fill: '#f97316' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut — Category */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-5">Stock by Category</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => v.toLocaleString('en-IN')} contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryData.slice(0, 4).map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                <span className="truncate max-w-[80px]">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warehouse Bar Chart + Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart — Warehouse stock */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-5">Warehouse Stock Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={warehouseData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '12px' }} />
              <Bar dataKey="stock" fill="#0b6e7d" radius={[6, 6, 0, 0]} name="Stock" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending Approvals */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-4">Pending Approvals</h2>
          {adjustments.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-icon text-2xl">✅</div>
              <p className="text-gray-500 text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adjustments.map((adj) => (
                <div key={adj._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {adj.product?.name || 'Unknown Product'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {adj.quantityDelta > 0 ? '+' : ''}{adj.quantityDelta} units · {adj.reason}
                    </div>
                    <div className="text-xs text-gray-400">{adj.requestedBy?.name}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleApprove(adj._id)}
                      className="btn-success btn-sm flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(adj._id)}
                      className="btn-danger btn-sm flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent movements table */}
      <div className="card">
        <h2 className="text-base font-bold text-gray-900 mb-4">Recent Stock Movements</h2>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Qty</th>
                <th>From / To</th>
                <th>By</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No movements yet</td></tr>
              ) : movements.map((m) => (
                <tr key={m._id}>
                  <td className="font-medium text-gray-900">
                    {m.product?.name || '—'}
                    <div className="text-xs text-gray-400">{m.product?.sku}</div>
                  </td>
                  <td>
                    <StatusBadge status={m.type} />
                  </td>
                  <td className="font-semibold">{m.quantity?.toLocaleString('en-IN')}</td>
                  <td className="text-xs">
                    {m.fromWarehouse && <div className="text-gray-500">From: {m.fromWarehouse.name}</div>}
                    {m.toWarehouse && <div className="text-gray-700">To: {m.toWarehouse.name}</div>}
                    {m.supplier && <div className="text-gray-500">Supplier: {m.supplier.name}</div>}
                    {m.customer && <div className="text-gray-500">Customer: {m.customer.name}</div>}
                  </td>
                  <td className="text-gray-500">{m.performedBy?.name || '—'}</td>
                  <td className="text-gray-400 text-xs">{formatDateTime(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
