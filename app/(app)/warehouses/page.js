'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Warehouse, MapPin } from 'lucide-react';
import { warehousesApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { cn } from '../../../lib/utils';

function WarehouseForm({ warehouse, onSave, onClose }) {
  const [form, setForm] = useState({ name: warehouse?.name||'', location: warehouse?.location||'', address: warehouse?.address||'', capacity: warehouse?.capacity||1000, contactPhone: warehouse?.contactPhone||'', notes: warehouse?.notes||'' });
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (warehouse) { await warehousesApi.update(warehouse._id, form); toast('Updated!','success'); }
      else { await warehousesApi.create(form); toast('Warehouse created!','success'); }
      onSave();
    } catch (err) { toast(err.response?.data?.message||'Failed','error'); }
    setSaving(false);
  };
  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group col-span-2"><label className="label">Name *</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
        <div className="form-group"><label className="label">City/Location *</label><input className="input" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} required /></div>
        <div className="form-group"><label className="label">Capacity (units)</label><input type="number" className="input" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})} /></div>
        <div className="form-group col-span-2"><label className="label">Address</label><textarea className="input h-16 resize-none" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
        <div className="form-group"><label className="label">Contact Phone</label><input className="input" value={form.contactPhone} onChange={e=>setForm({...form,contactPhone:e.target.value})} /></div>
      </div>
      <div className="flex gap-3"><button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving?'Saving...':warehouse?'Update':'Create Warehouse'}</button></div>
    </form>
  );
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWarehouses = async () => { setLoading(true); try { const res = await warehousesApi.getAll(); setWarehouses(res.data.data||[]); } catch {} setLoading(false); };
  useEffect(() => { fetchWarehouses(); }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try { await warehousesApi.delete(deleteTarget._id); toast('Warehouse deactivated','success'); setDeleteTarget(null); fetchWarehouses(); } catch {}
    setDeleting(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Warehouses</h1><p className="text-gray-500 text-sm">{warehouses.length} active warehouses</p></div>
        <button className="btn-primary" onClick={()=>{setEditTarget(null);setModalOpen(true);}}><Plus className="w-4 h-4"/>Add Warehouse</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length:3}).map((_,i)=><div key={i} className="card animate-pulse h-48"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <div key={wh._id} className="card-hover relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center">
                  <Warehouse className="w-6 h-6 text-brand-700" />
                </div>
                <div className="flex gap-1.5">
                  <button className="btn-ghost btn-icon min-h-0 p-1.5" onClick={()=>{setEditTarget(wh);setModalOpen(true);}}><Edit2 className="w-3.5 h-3.5"/></button>
                  <button className="btn-ghost btn-icon min-h-0 p-1.5 hover:text-red-600" onClick={()=>setDeleteTarget(wh)}><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{wh.name}</h3>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                <MapPin className="w-3.5 h-3.5"/><span>{wh.location}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  {label:'Stock',value:wh.totalStock?.toLocaleString('en-IN')||0},
                  {label:'Capacity',value:`${wh.capacityUsed||0}%`},
                  {label:'Low Stock',value:wh.lowStockCount||0},
                ].map(({label,value})=>(
                  <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <div className="font-bold text-gray-900 text-sm">{value}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>
                ))}
              </div>

              {/* Capacity bar */}
              <div className="mt-3">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', (wh.capacityUsed||0) > 80 ? 'bg-red-500' : (wh.capacityUsed||0) > 60 ? 'bg-amber-500' : 'bg-brand-700')} style={{width:`${wh.capacityUsed||0}%`}} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editTarget?'Edit Warehouse':'Add Warehouse'} size="md">
        <WarehouseForm warehouse={editTarget} onSave={()=>{setModalOpen(false);fetchWarehouses();}} onClose={()=>setModalOpen(false)} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} title="Deactivate Warehouse" message={`Deactivate "${deleteTarget?.name}"?`} loading={deleting} />
    </div>
  );
}
