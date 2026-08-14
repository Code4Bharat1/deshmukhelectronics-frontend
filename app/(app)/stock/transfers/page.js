'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { stockApi, productsApi, warehousesApi } from '../../../../lib/api';
import { toast } from '../../../../components/ui/Toast';
import Modal from '../../../../components/ui/Modal';
import { formatDateTime, cn } from '../../../../lib/utils';

function TransferForm({ onSave, onClose }) {
  const [form, setForm] = useState({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: 1, notes: '' });
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([productsApi.getAll({ limit: 100 }), warehousesApi.getAll()])
      .then(([p, w]) => {
        setProducts(p.data.data || []);
        setWarehouses(w.data.data || []);
        if (w.data.data?.length >= 2) {
          setForm(f => ({...f, fromWarehouseId: w.data.data[0]._id, toWarehouseId: w.data.data[1]._id}));
        }
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.fromWarehouseId === form.toWarehouseId) { toast('Source and destination must be different', 'error'); return; }
    setSaving(true);
    try {
      await stockApi.createTransfer({ ...form, quantity: Number(form.quantity) });
      toast('Transfer recorded!', 'success');
      onSave();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to transfer', 'error');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="form-group">
        <label className="label">Product *</label>
        <select className="input select" value={form.productId} onChange={(e) => setForm({...form, productId: e.target.value})} required>
          <option value="">— Select Product —</option>
          {products.map((p) => <option key={p._id} value={p._id}>{p.name} — Stock: {p.currentStock} {p.unit}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="label">From Warehouse *</label>
          <select className="input select" value={form.fromWarehouseId} onChange={(e) => setForm({...form, fromWarehouseId: e.target.value})} required>
            {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">To Warehouse *</label>
          <select className="input select" value={form.toWarehouseId} onChange={(e) => setForm({...form, toWarehouseId: e.target.value})} required>
            {warehouses.filter(w => w._id !== form.fromWarehouseId).map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Quantity *</label>
          <input type="number" min="1" className="input" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} required />
        </div>
      </div>
      <div className="form-group">
        <label className="label">Notes</label>
        <input className="input" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
      </div>
      <div className="flex gap-3">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Transferring...' : 'Create Transfer'}</button>
      </div>
    </form>
  );
}

export default function TransfersPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stockApi.getTransfers({ limit: 30 });
      setRecords(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Stock Transfers</h1><p className="text-gray-500 text-sm">{total} records</p></div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> New Transfer</button>
      </div>
      <div className="table-wrapper card p-0">
        <table className="table">
          <thead><tr><th>Product</th><th>Qty</th><th>From</th><th>To</th><th>By</th><th>Date</th></tr></thead>
          <tbody>
            {loading ? Array.from({length:5}).map((_,i)=><tr key={i}>{Array.from({length:6}).map((_,j)=><td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
            : records.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">No transfers yet</td></tr>
            : records.map((r) => (
              <tr key={r._id}>
                <td><div className="font-semibold text-sm">{r.product?.name}</div><div className="text-xs text-gray-400">{r.product?.sku}</div></td>
                <td className="font-bold text-blue-700">{r.quantity} <span className="text-gray-400 font-normal text-xs">{r.product?.unit}</span></td>
                <td className="text-gray-600">{r.fromWarehouse?.name}</td>
                <td className="text-gray-600">{r.toWarehouse?.name}</td>
                <td className="text-gray-500 text-sm">{r.performedBy?.name}</td>
                <td className="text-gray-400 text-xs">{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Stock Transfer" size="md">
        <TransferForm onSave={() => { setModalOpen(false); fetchRecords(); }} onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
