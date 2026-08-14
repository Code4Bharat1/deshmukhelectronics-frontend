'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Truck, UserCheck, Edit2, Trash2 } from 'lucide-react';
import { suppliersApi, customersApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { cn } from '../../../lib/utils';

function PartyForm({ type, party, onSave, onClose }) {
  const isSupplier = type === 'supplier';
  const [form, setForm] = useState({
    name: party?.name||'', contactPerson: party?.contactPerson||'', phone: party?.phone||'',
    email: party?.email||'', city: party?.city||'', address: party?.address||'', gstin: party?.gstin||'',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const api = isSupplier ? suppliersApi : customersApi;
    try {
      if (party) { await api.update(party._id, form); toast('Updated!','success'); }
      else { await api.create(form); toast(`${isSupplier?'Supplier':'Customer'} added!`,'success'); }
      onSave();
    } catch (err) { toast(err.response?.data?.message||'Failed','error'); }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group col-span-2"><label className="label">{isSupplier?'Company':'Customer'} Name *</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
        <div className="form-group"><label className="label">Contact Person</label><input className="input" value={form.contactPerson} onChange={e=>setForm({...form,contactPerson:e.target.value})} /></div>
        <div className="form-group"><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
        <div className="form-group"><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
        <div className="form-group"><label className="label">City</label><input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} /></div>
        <div className="form-group col-span-2"><label className="label">GSTIN</label><input className="input uppercase" value={form.gstin} onChange={e=>setForm({...form,gstin:e.target.value.toUpperCase()})} /></div>
        <div className="form-group col-span-2"><label className="label">Address</label><textarea className="input h-16 resize-none" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
      </div>
      <div className="flex gap-3"><button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving?'Saving...':party?'Update':'Add'}</button></div>
    </form>
  );
}

function PartyTab({ type }) {
  const isSupplier = type === 'supplier';
  const api = isSupplier ? suppliersApi : customersApi;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => { setLoading(true); try { const r = await api.getAll(); setItems(r.data.data||[]); } catch {} setLoading(false); }, [type]);
  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await api.delete(deleteTarget._id); toast('Deleted','success'); setDeleteTarget(null); fetch(); } catch {}
    setDeleting(false);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={()=>{setEditTarget(null);setModal(true);}}>
          <Plus className="w-4 h-4"/> Add {isSupplier?'Supplier':'Customer'}
        </button>
      </div>
      <div className="table-wrapper card p-0">
        <table className="table">
          <thead><tr><th>Name</th><th>Contact</th><th>City</th><th>GSTIN</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? Array.from({length:4}).map((_,i)=><tr key={i}>{Array.from({length:5}).map((_,j)=><td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
            : items.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-gray-400">No {isSupplier?'suppliers':'customers'} yet</td></tr>
            : items.map((item) => (
              <tr key={item._id}>
                <td><div className="font-semibold text-gray-900">{item.name}</div><div className="text-xs text-gray-400">{item.contactPerson}</div></td>
                <td><div className="text-sm">{item.phone}</div><div className="text-xs text-gray-400">{item.email}</div></td>
                <td className="text-gray-600">{item.city||'—'}</td>
                <td className="font-mono text-xs text-gray-500">{item.gstin||'—'}</td>
                <td>
                  <div className="flex gap-1.5">
                    <button className="btn-ghost btn-icon min-h-0 p-1.5" onClick={()=>{setEditTarget(item);setModal(true);}}><Edit2 className="w-3.5 h-3.5"/></button>
                    <button className="btn-ghost btn-icon min-h-0 p-1.5 hover:text-red-600" onClick={()=>setDeleteTarget(item)}><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editTarget?`Edit ${isSupplier?'Supplier':'Customer'}`:`Add ${isSupplier?'Supplier':'Customer'}`} size="md">
        <PartyForm type={type} party={editTarget} onSave={()=>{setModal(false);fetch();}} onClose={()=>setModal(false)} />
      </Modal>
      <ConfirmDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} title={`Delete ${isSupplier?'Supplier':'Customer'}`} message={`Delete "${deleteTarget?.name}"?`} loading={deleting} />
    </>
  );
}

export default function SuppliersPage() {
  const [tab, setTab] = useState('supplier');
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Suppliers & Customers</h1>
        <div className="flex gap-2">
          <button className={cn('btn-sm flex items-center gap-1.5', tab==='supplier'?'btn-primary':'btn-secondary')} onClick={()=>setTab('supplier')}>
            <Truck className="w-3.5 h-3.5"/> Suppliers
          </button>
          <button className={cn('btn-sm flex items-center gap-1.5', tab==='customer'?'btn-primary':'btn-secondary')} onClick={()=>setTab('customer')}>
            <UserCheck className="w-3.5 h-3.5"/> Customers
          </button>
        </div>
      </div>
      <PartyTab key={tab} type={tab} />
    </div>
  );
}
