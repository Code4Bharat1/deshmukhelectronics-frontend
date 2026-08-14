'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { stockApi, productsApi, warehousesApi } from '../../../../lib/api';
import { toast } from '../../../../components/ui/Toast';
import StatusBadge from '../../../../components/ui/StatusBadge';
import Modal from '../../../../components/ui/Modal';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import { formatDateTime } from '../../../../lib/utils';

function AdjustmentForm({ onSave, onClose }) {
  const [form, setForm] = useState({ productId: '', warehouseId: '', quantityDelta: 0, reason: '' });
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([productsApi.getAll({ limit: 100 }), warehousesApi.getAll()])
      .then(([p, w]) => { setProducts(p.data.data || []); setWarehouses(w.data.data || []); if (w.data.data?.length) setForm(f=>({...f, warehouseId: w.data.data[0]._id})); });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.quantityDelta || form.quantityDelta === 0) { toast('Quantity delta cannot be zero', 'error'); return; }
    setSaving(true);
    try {
      await stockApi.createAdjustment({ ...form, quantityDelta: Number(form.quantityDelta) });
      toast('Adjustment request submitted for approval', 'success');
      onSave();
    } catch (err) { toast(err.response?.data?.message || 'Failed', 'error'); }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="form-group"><label className="label">Product *</label>
        <select className="input select" value={form.productId} onChange={(e)=>setForm({...form,productId:e.target.value})} required>
          <option value="">— Select Product —</option>{products.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group"><label className="label">Warehouse *</label>
          <select className="input select" value={form.warehouseId} onChange={(e)=>setForm({...form,warehouseId:e.target.value})} required>
            {warehouses.map(w=><option key={w._id} value={w._id}>{w.name}</option>)}</select></div>
        <div className="form-group"><label className="label">Quantity Delta (±) *</label>
          <input type="number" className="input" value={form.quantityDelta} onChange={(e)=>setForm({...form,quantityDelta:e.target.value})} placeholder="e.g. -5 or +10" required /></div>
      </div>
      <div className="form-group"><label className="label">Reason *</label>
        <input className="input" value={form.reason} onChange={(e)=>setForm({...form,reason:e.target.value})} required /></div>
      <div className="flex gap-3">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Submitting...' : 'Request Adjustment'}</button>
      </div>
    </form>
  );
}

export default function AdjustmentsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try { const res = await stockApi.getAdjustments({ status: filterStatus, limit: 30 }); setRecords(res.data.data || []); } catch {}
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleApprove = async () => {
    setProcessing(true);
    try { await stockApi.approveAdjustment(approveTarget._id, { comment: 'Approved' }); toast('Approved!', 'success'); setApproveTarget(null); fetchRecords(); }
    catch (err) { toast(err.response?.data?.message || 'Failed', 'error'); }
    setProcessing(false);
  };

  const handleReject = async () => {
    setProcessing(true);
    try { await stockApi.rejectAdjustment(rejectTarget._id, { comment: 'Rejected' }); toast('Rejected', 'success'); setRejectTarget(null); fetchRecords(); }
    catch { }
    setProcessing(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Stock Adjustments</h1></div>
        <div className="flex gap-2">
          {['','pending','approved','rejected'].map(s => (
            <button key={s} className={`btn-sm ${filterStatus===s?'btn-primary':'btn-secondary'}`} onClick={()=>setFilterStatus(s)}>
              {s || 'All'}
            </button>
          ))}
          <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Request</button>
        </div>
      </div>
      <div className="table-wrapper card p-0">
        <table className="table">
          <thead><tr><th>Product</th><th>Delta</th><th>Warehouse</th><th>Reason</th><th>Requested By</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? Array.from({length:4}).map((_,i)=><tr key={i}>{Array.from({length:7}).map((_,j)=><td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
            : records.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">No adjustments</td></tr>
            : records.map((r) => (
              <tr key={r._id}>
                <td className="font-semibold text-sm">{r.product?.name}</td>
                <td className={`font-bold ${r.quantityDelta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{r.quantityDelta > 0 ? '+' : ''}{r.quantityDelta}</td>
                <td className="text-gray-600">{r.warehouse?.name}</td>
                <td className="text-gray-600 text-sm max-w-[150px] truncate">{r.reason}</td>
                <td className="text-gray-500 text-sm">{r.requestedBy?.name}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  {r.status === 'pending' && (
                    <div className="flex gap-1.5">
                      <button className="btn-success btn-sm flex items-center gap-1" onClick={()=>setApproveTarget(r)}><CheckCircle className="w-3 h-3"/>Approve</button>
                      <button className="btn-danger btn-sm flex items-center gap-1" onClick={()=>setRejectTarget(r)}><XCircle className="w-3 h-3"/>Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title="Request Stock Adjustment" size="md">
        <AdjustmentForm onSave={()=>{setModalOpen(false);fetchRecords();}} onClose={()=>setModalOpen(false)} />
      </Modal>
      <ConfirmDialog isOpen={!!approveTarget} onClose={()=>setApproveTarget(null)} onConfirm={handleApprove} title="Approve Adjustment" message={`Approve ${approveTarget?.quantityDelta > 0 ? '+' : ''}${approveTarget?.quantityDelta} units for ${approveTarget?.product?.name}? Stock will be updated.`} confirmLabel="Approve" confirmClass="btn-success" loading={processing} />
      <ConfirmDialog isOpen={!!rejectTarget} onClose={()=>setRejectTarget(null)} onConfirm={handleReject} title="Reject Adjustment" message="Reject this adjustment request?" confirmLabel="Reject" loading={processing} />
    </div>
  );
}
