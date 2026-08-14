'use client';
import { useState, useEffect, useCallback } from 'react';
import { Package, Activity } from 'lucide-react';
import { stockApi } from '../../../../lib/api';
import StatusBadge from '../../../../components/ui/StatusBadge';
import { formatDateTime } from '../../../../lib/utils';

export default function MovementsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stockApi.getMovements({ page, limit: 25, type: typeFilter || undefined });
      setRecords(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {}
    setLoading(false);
  }, [page, typeFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const types = ['','incoming','outgoing','transfer','adjustment','damaged','return'];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Stock Movements</h1><p className="text-gray-500 text-sm">{total} total movements</p></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {types.map(t => (
          <button key={t} className={`btn-sm ${typeFilter===t?'btn-primary':'btn-secondary'}`} onClick={()=>{setTypeFilter(t);setPage(1);}}>
            {t || 'All'}</button>
        ))}
      </div>

      <div className="table-wrapper card p-0">
        <table className="table">
          <thead><tr><th>Product</th><th>Type</th><th>Qty</th><th>From</th><th>To</th><th>Party</th><th>By</th><th>Date</th></tr></thead>
          <tbody>
            {loading ? Array.from({length:6}).map((_,i)=><tr key={i}>{Array.from({length:8}).map((_,j)=><td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
            : records.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400"><div className="flex flex-col items-center gap-2"><Activity className="w-8 h-8 text-gray-300"/><span>No movements yet</span></div></td></tr>
            : records.map((r) => (
              <tr key={r._id}>
                <td><div className="font-semibold text-sm">{r.product?.name}</div><div className="text-xs text-gray-400 font-mono">{r.product?.sku}</div></td>
                <td><StatusBadge status={r.type} /></td>
                <td className="font-bold">{r.quantity}</td>
                <td className="text-gray-500 text-sm">{r.fromWarehouse?.name || '—'}</td>
                <td className="text-gray-500 text-sm">{r.toWarehouse?.name || '—'}</td>
                <td className="text-gray-500 text-sm">{r.supplier?.name || r.customer?.name || '—'}</td>
                <td className="text-gray-500 text-sm">{r.performedBy?.name}</td>
                <td className="text-gray-400 text-xs">{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 25 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{(page-1)*25+1}–{Math.min(page*25,total)} of {total}</span>
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</button>
            <button className="btn-secondary btn-sm" disabled={page*25>=total} onClick={()=>setPage(p=>p+1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
