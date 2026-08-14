'use client';
import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Download, FileText } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { reportsApi } from '../../../lib/api';
import { formatCurrency, downloadCSV, cn } from '../../../lib/utils';
import { toast } from '../../../components/ui/Toast';

const reportTypes = [
  { key: 'stock-summary', label: 'Stock Summary', icon: '📦' },
  { key: 'movement', label: 'Movement Report', icon: '📊' },
  { key: 'valuation', label: 'Inventory Valuation', icon: '💰' },
  { key: 'low-stock', label: 'Low Stock Alert', icon: '⚠️' },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('stock-summary');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.get(activeReport, { from: dateFrom, to: dateTo });
      setData(res.data.data || []);
    } catch { toast('Failed to fetch report', 'error'); }
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [activeReport]);

  const handleExport = async () => {
    try {
      const res = await reportsApi.exportCSV(activeReport, { from: dateFrom, to: dateTo });
      downloadCSV(res.data, `${activeReport}-${dateFrom}-${dateTo}.csv`);
      toast('Report exported!', 'success');
    } catch { toast('Export failed', 'error'); }
  };

  const renderChart = () => {
    if (!data || data.length === 0) return (
      <div className="empty-state py-16">
        <div className="empty-icon">📊</div>
        <p className="text-gray-400">No data for selected period</p>
      </div>
    );

    if (activeReport === 'movement') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="date" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{borderRadius:'10px',border:'none',fontSize:'12px'}}/>
            <Legend wrapperStyle={{fontSize:'12px'}}/>
            <Bar dataKey="incoming" fill="#0b6e7d" radius={[4,4,0,0]} name="Incoming"/>
            <Bar dataKey="outgoing" fill="#f97316" radius={[4,4,0,0]} name="Outgoing"/>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {data.length > 0 && Object.keys(data[0]).filter(k => !['_id','id'].includes(k)).map(k => (
                <th key={k} className="capitalize">{k.replace(/([A-Z])/g,' $1')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {Object.entries(row).filter(([k]) => !['_id','id'].includes(k)).map(([k, v]) => (
                  <td key={k}>{typeof v === 'number' && k.toLowerCase().includes('price') || k.toLowerCase().includes('value') ? formatCurrency(v) : v?.toString() || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Reports</h1><p className="text-gray-500 text-sm">Inventory & operational insights</p></div>
        <button className="btn-secondary flex items-center gap-2" onClick={handleExport}>
          <Download className="w-4 h-4"/>Export CSV
        </button>
      </div>

      {/* Report type selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {reportTypes.map((r) => (
          <button
            key={r.key}
            className={cn('flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left',
              activeReport===r.key ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-gray-100 bg-white text-gray-700 hover:bg-gray-50'
            )}
            onClick={() => setActiveReport(r.key)}
          >
            <span className="text-2xl">{r.icon}</span>
            <span className="font-semibold text-sm">{r.label}</span>
          </button>
        ))}
      </div>

      {/* Date filters */}
      <div className="card flex flex-col md:flex-row items-end gap-4">
        <div className="form-group flex-1">
          <label className="label">From Date</label>
          <input type="date" className="input" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
        </div>
        <div className="form-group flex-1">
          <label className="label">To Date</label>
          <input type="date" className="input" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={fetchReport} disabled={loading}>
          {loading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Loading...</span> : '⚡ Generate'}
        </button>
      </div>

      {/* Report output */}
      <div className="card">
        <h2 className="text-base font-bold text-gray-900 mb-4">
          {reportTypes.find(r=>r.key===activeReport)?.label}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : renderChart()}
      </div>
    </div>
  );
}
