'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { stockApi, productsApi, warehousesApi, customersApi } from '../../../../lib/api';
import { toast } from '../../../../components/ui/Toast';
import Modal from '../../../../components/ui/Modal';
import { formatDateTime, formatCurrency, cn } from '../../../../lib/utils';

function OutgoingForm({ onSave, onClose }) {
  const [form, setForm] = useState({ productId: '', warehouseId: '', customerId: '', quantity: 1, referenceNo: '', unitPrice: '', notes: '' });
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([productsApi.getAll({ limit: 100 }), warehousesApi.getAll(), customersApi.getAll()])
      .then(([p, w, c]) => {
        setProducts(p.data.data || []);
        setWarehouses(w.data.data || []);
        setCustomers(c.data.data || []);
        if (w.data.data?.length) setForm(f => ({...f, warehouseId: w.data.data[0]._id}));
      });
  }, []);

  const handleProductChange = (id) => {
    const p = products.find(x => x._id === id);
    setSelectedProduct(p || null);
    setForm(f => ({...f, productId: id}));
  };

  const available = selectedProduct?.currentStock || 0;
  const isExceeding = form.quantity > available;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isExceeding) { toast(`Insufficient stock. Available: ${available}`, 'error'); return; }
    setSaving(true);
    try {
      await stockApi.createOutgoing({ ...form, quantity: Number(form.quantity), unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined });
      toast('Outgoing stock recorded!', 'success');
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
        <select className="input select" value={form.productId} onChange={(e) => handleProductChange(e.target.value)} required>
          <option value="">— Select Product —</option>
          {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku}) — Stock: {p.currentStock}</option>)}
        </select>
      </div>
      {isExceeding && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4" /> Quantity exceeds available stock ({available} {selectedProduct?.unit})
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="label">Warehouse *</label>
          <select className="input select" value={form.warehouseId} onChange={(e) => setForm({...form, warehouseId: e.target.value})} required>
            {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Quantity *</label>
          <input type="number" min="1" className={cn('input', isExceeding && 'border-red-400 ring-1 ring-red-400')} value={form.quantity} onChange={(e) => setForm({...form, quantity: Number(e.target.value)})} required />
        </div>
        <div className="form-group">
          <label className="label">Customer</label>
          <select className="input select" value={form.customerId} onChange={(e) => setForm({...form, customerId: e.target.value})}>
            <option value="">— None —</option>
            {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Unit Price (₹)</label>
          <input type="number" className="input" value={form.unitPrice} onChange={(e) => setForm({...form, unitPrice: e.target.value})} />
        </div>
      </div>
      <div className="form-group">
        <label className="label">Reference No.</label>
        <input className="input" value={form.referenceNo} onChange={(e) => setForm({...form, referenceNo: e.target.value})} />
      </div>
      <div className="flex gap-3">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving || isExceeding}>{saving ? 'Recording...' : 'Record Dispatch'}</button>
      </div>
    </form>
  );
}

export default function OutgoingPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stockApi.getOutgoing({ page, limit: 20 });
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
          <h1 className="page-title">Outgoing Stock / Dispatch</h1>
          <p className="text-gray-500 text-sm">{total} records</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> New Dispatch
        </button>
      </div>

      <div className="table-wrapper card p-0">
        <table className="table">
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Warehouse</th><th>Customer</th><th>Value</th><th>By</th><th>Date</th></tr>
          </thead>
          <tbody>
            {loading ? Array.from({length:5}).map((_,i)=><tr key={i}>{Array.from({length:7}).map((_,j)=><td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
            : records.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">No dispatch records yet</td></tr>
            : records.map((r) => (
              <tr key={r._id}>
                <td><div className="font-semibold text-sm">{r.product?.name}</div><div className="text-xs text-gray-400">{r.product?.sku}</div></td>
                <td className="font-bold text-red-600">-{r.quantity} <span className="text-gray-400 font-normal text-xs">{r.product?.unit}</span></td>
                <td className="text-gray-600">{r.fromWarehouse?.name || '—'}</td>
                <td className="text-gray-600">{r.customer?.name || '—'}</td>
                <td>{r.totalValue ? formatCurrency(r.totalValue) : '—'}</td>
                <td className="text-gray-500 text-sm">{r.performedBy?.name}</td>
                <td className="text-gray-400 text-xs">{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Dispatch" size="md">
        <OutgoingForm onSave={() => { setModalOpen(false); fetchRecords(); }} onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
