'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { returnsApi, productsApi, warehousesApi, customersApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { formatDateTime } from '../../../lib/utils';

function ReturnForm({ onSave, onClose }) {
  const [form, setForm] = useState({ productId: '', warehouseId: '', customerId: '', quantity: 1, reason: '', disposition: 'restock' });
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([productsApi.getAll({limit:100}),warehousesApi.getAll(),customersApi.getAll()])
      .then(([p,w,c])=>{setProducts(p.data.data||[]);setWarehouses(w.data.data||[]);setCustomers(c.data.data||[]);if(w.data.data?.length)setForm(f=>({...f,warehouseId:w.data.data[0]._id}));});
  },[]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await returnsApi.create({...form,quantity:Number(form.quantity)}); toast('Return recorded!','success'); onSave(); }
    catch (err) { toast(err.response?.data?.message||'Failed','error'); }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="form-group"><label className="label">Product *</label>
        <select className="input select" value={form.productId} onChange={e=>setForm({...form,productId:e.target.value})} required>
          <option value="">— Select Product —</option>{products.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group"><label className="label">Warehouse *</label>
          <select className="input select" value={form.warehouseId} onChange={e=>setForm({...form,warehouseId:e.target.value})} required>
            {warehouses.map(w=><option key={w._id} value={w._id}>{w.name}</option>)}</select></div>
        <div className="form-group"><label className="label">Quantity *</label>
          <input type="number" min="1" className="input" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} required/></div>
        <div className="form-group"><label className="label">Customer</label>
          <select className="input select" value={form.customerId} onChange={e=>setForm({...form,customerId:e.target.value})}>
            <option value="">— None —</option>{customers.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
        <div className="form-group"><label className="label">Disposition</label>
          <select className="input select" value={form.disposition} onChange={e=>setForm({...form,disposition:e.target.value})}>
            <option value="restock">Restock</option><option value="repair">Repair</option><option value="scrap">Scrap</option><option value="return_to_supplier">Return to Supplier</option></select></div>
      </div>
      <div className="form-group"><label className="label">Reason *</label>
        <input className="input" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} required/></div>
      <div className="flex gap-3"><button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving?'Recording...':'Record Return'}</button></div>
    </form>
  );
}

export default function ReturnsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const res = await returnsApi.getAll({limit:30}); setRecords(res.data.data||[]); setTotal(res.data.total||0); } catch {}
    setLoading(false);
  }, []);
  useEffect(()=>{fetch();},[fetch]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Returns</h1><p className="text-gray-500 text-sm">{total} records</p></div>
        <button className="btn-primary" onClick={()=>setModal(true)}><Plus className="w-4 h-4"/>Record Return</button>
      </div>
      <div className="table-wrapper card p-0">
        <table className="table">
          <thead><tr><th>Product</th><th>Qty</th><th>Customer</th><th>Disposition</th><th>Reason</th><th>By</th><th>Date</th></tr></thead>
          <tbody>
            {loading ? Array.from({length:4}).map((_,i)=><tr key={i}>{Array.from({length:7}).map((_,j)=><td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
            : records.length===0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">No returns yet</td></tr>
            : records.map(r=>(
              <tr key={r._id}>
                <td><div className="font-semibold text-sm">{r.product?.name}</div><div className="text-xs text-gray-400">{r.product?.sku}</div></td>
                <td className="font-bold text-purple-700">{r.quantity}</td>
                <td className="text-gray-600">{r.customer?.name||'—'}</td>
                <td><span className="badge bg-blue-100 text-blue-800 capitalize">{r.disposition?.replace(/_/g,' ')||'—'}</span></td>
                <td className="text-gray-600 text-sm">{r.reason||'—'}</td>
                <td className="text-gray-500 text-sm">{r.performedBy?.name}</td>
                <td className="text-gray-400 text-xs">{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={()=>setModal(false)} title="Record Return" size="md">
        <ReturnForm onSave={()=>{setModal(false);fetch();}} onClose={()=>setModal(false)}/>
      </Modal>
    </div>
  );
}
