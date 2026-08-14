'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ArrowDownToLine } from 'lucide-react';
import { stockApi, productsApi, warehousesApi, suppliersApi } from '../../../../lib/api';
import { toast } from '../../../../components/ui/Toast';
import StatusBadge from '../../../../components/ui/StatusBadge';
import Modal from '../../../../components/ui/Modal';
import { formatDateTime, formatCurrency } from '../../../../lib/utils';

function IncomingForm({ onSave, onClose }) {
  const [form, setForm] = useState({ productId: '', warehouseId: '', supplierId: '', quantity: 1, referenceNo: '', unitPrice: '', notes: '' });
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([productsApi.getAll({ limit: 100 }), warehousesApi.getAll(), suppliersApi.getAll()])
      .then(([p, w, s]) => {
        setProducts(p.data.data || []);
        setWarehouses(w.data.data || []);
        setSuppliers(s.data.data || []);
        if (w.data.data?.length) setForm(f => ({...f, warehouseId: w.data.data[0]._id}));
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await stockApi.createIncoming({ ...form, quantity: Number(form.quantity), unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined });
      toast('Incoming stock recorded!', 'success');
      onSave();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to record', 'error');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="form-group">
        <label className="label">Product *</label>
        <select className="input select" value={form.productId} onChange={(e) => setForm({...form, productId: e.target.value})} required>
          <option value="">— Select Product —</option>
          {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="label">Warehouse *</label>
          <select className="input select" value={form.warehouseId} onChange={(e) => setForm({...form, warehouseId: e.target.value})} required>
            {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Quantity *</label>
          <input type="number" min="1" className="input" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} required />
        </div>
        <div className="form-group">
          <label className="label">Supplier</label>
          <select className="input select" value={form.supplierId} onChange={(e) => setForm({...form, supplierId: e.target.value})}>
            <option value="">— None —</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Unit Price (₹)</label>
          <input type="number" className="input" value={form.unitPrice} onChange={(e) => setForm({...form, unitPrice: e.target.value})} />
        </div>
      </div>
      <div className="form-group">
        <label className="label">Reference No. (Invoice/PO)</label>
        <input className="input" value={form.referenceNo} onChange={(e) => setForm({...form, referenceNo: e.target.value})} />
      </div>
      <div className="form-group">
        <label className="label">Notes</label>
        <input className="input" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
      </div>
      <div className="flex gap-3">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Recording...' : 'Record Incoming'}</button>
      </div>
    </form>
  );
}

export default function IncomingPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stockApi.getIncoming({ page, limit: 20 });
      setRecords(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Incoming Stock</h1>
          <p className="text-gray-500 text-sm">{total} records</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> New Receipt
        </button>
      </div>

      <div className="table-wrapper card p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Warehouse</th>
              <th>Supplier</th>
              <th>Ref No.</th>
              <th>Value</th>
              <th>By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({length:5}).map((_,i)=><tr key={i}>{Array.from({length:8}).map((_,j)=><td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
            : records.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">No incoming records yet</td></tr>
            : records.map((r) => (
              <tr key={r._id}>
                <td><div className="font-semibold text-gray-900 text-sm">{r.product?.name}</div><div className="text-xs text-gray-400">{r.product?.sku}</div></td>
                <td className="font-bold text-emerald-700">+{r.quantity} <span className="text-gray-400 font-normal text-xs">{r.product?.unit}</span></td>
                <td className="text-gray-600">{r.toWarehouse?.name || '—'}</td>
                <td className="text-gray-600">{r.supplier?.name || '—'}</td>
                <td className="font-mono text-xs text-gray-500">{r.referenceNo || '—'}</td>
                <td>{r.totalValue ? formatCurrency(r.totalValue) : '—'}</td>
                <td className="text-gray-500 text-sm">{r.performedBy?.name}</td>
                <td className="text-gray-400 text-xs">{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Incoming Receipt" size="md">
        <IncomingForm onSave={() => { setModalOpen(false); fetchRecords(); }} onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
