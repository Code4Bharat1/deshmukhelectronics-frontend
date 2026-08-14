'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { stockApi, productsApi, warehousesApi } from '../../../../lib/api';
import { toast } from '../../../../components/ui/Toast';
import Modal from '../../../../components/ui/Modal';
import { formatDateTime } from '../../../../lib/utils';

function DamagedForm({ onSave, onClose }) {
  const [form, setForm] = useState({ productId: '', warehouseId: '', quantity: 1, reason: '', notes: '' });
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([productsApi.getAll({ limit: 100 }), warehousesApi.getAll()])
      .then(([p, w]) => { setProducts(p.data.data || []); setWarehouses(w.data.data || []); if (w.data.data?.length) setForm(f=>({...f, warehouseId: w.data.data[0]._id})); });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await stockApi.createDamaged({ ...form, quantity: Number(form.quantity) });
      toast('Damaged stock logged', 'success');
      onSave();
    } catch (err) { toast(err.response?.data?.message || 'Failed', 'error'); }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="form-group"><label className="label">Product *</label>
        <select className="input select" value={form.productId} onChange={(e)=>setForm({...form,productId:e.target.value})} required>
          <option value="">— Select Product —</option>{products.map(p=><option key={p._id} value={p._id}>{p.name} — Stock: {p.currentStock}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group"><label className="label">Warehouse *</label>
          <select className="input select" value={form.warehouseId} onChange={(e)=>setForm({...form,warehouseId:e.target.value})} required>
            {warehouses.map(w=><option key={w._id} value={w._id}>{w.name}</option>)}</select></div>
        <div className="form-group"><label className="label">Quantity *</label>
          <input type="number" min="1" className="input" value={form.quantity} onChange={(e)=>setForm({...form,quantity:e.target.value})} required /></div>
      </div>
      <div className="form-group"><label className="label">Reason *</label>
        <input className="input" value={form.reason} onChange={(e)=>setForm({...form,reason:e.target.value})} placeholder="e.g. Physical damage, Water damage" required /></div>
      <div className="form-group"><label className="label">Notes</label>
        <input className="input" value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} /></div>
      <div className="flex gap-3">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-danger flex-1" disabled={saving}>{saving ? 'Logging...' : 'Log Damaged Stock'}</button>
      </div>
    </form>
  );
}

export default function DamagedPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try { const res = await stockApi.getDamaged({ limit: 30 }); setRecords(res.data.data || []); setTotal(res.data.total || 0); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Damaged Stock</h1><p className="text-gray-500 text-sm">{total} records · excluded from available stock</p></div>
        <button className="btn-danger" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Log Damaged</button>
      </div>
      <div className="table-wrapper card p-0">
        <table className="table">
          <thead><tr><th>Product</th><th>Qty</th><th>Warehouse</th><th>Reason</th><th>Reported By</th><th>Date</th></tr></thead>
          <tbody>
            {loading ? Array.from({length:4}).map((_,i)=><tr key={i}>{Array.from({length:6}).map((_,j)=><td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
            : records.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">No damaged records</td></tr>
            : records.map((r) => (
              <tr key={r._id}>
                <td><div className="font-semibold text-sm">{r.product?.name}</div><div className="text-xs text-gray-400">{r.product?.sku}</div></td>
                <td className="font-bold text-red-600">{r.quantity} <span className="text-xs text-gray-400 font-normal">{r.product?.unit}</span></td>
                <td className="text-gray-600">{r.fromWarehouse?.name || '—'}</td>
                <td className="text-gray-600 text-sm">{r.reason || '—'}</td>
                <td className="text-gray-500 text-sm">{r.performedBy?.name}</td>
                <td className="text-gray-400 text-xs">{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title="Log Damaged Stock" size="md">
        <DamagedForm onSave={()=>{setModalOpen(false);fetchRecords();}} onClose={()=>setModalOpen(false)} />
      </Modal>
    </div>
  );
}
