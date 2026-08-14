'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, ClipboardList, CheckCircle } from 'lucide-react';
import { auditsApi, productsApi, warehousesApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { formatDate, formatDateTime } from '../../../lib/utils';

function StartAuditForm({ onSave, onClose }) {
  const [form, setForm] = useState({ warehouseId: '', auditName: '', notes: '' });
  const [warehouses, setWarehouses] = useState([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { warehousesApi.getAll().then(r=>{ setWarehouses(r.data.data||[]); if(r.data.data?.length) setForm(f=>({...f,warehouseId:r.data.data[0]._id})); }); }, []);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await auditsApi.start({...form}); toast('Audit started!','success'); onSave(); }
    catch (err) { toast(err.response?.data?.message||'Failed','error'); }
    setSaving(false);
  };
  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="form-group"><label className="label">Audit Name *</label><input className="input" value={form.auditName} onChange={e=>setForm({...form,auditName:e.target.value})} placeholder="e.g. Q2 2026 Physical Count" required/></div>
      <div className="form-group"><label className="label">Warehouse *</label>
        <select className="input select" value={form.warehouseId} onChange={e=>setForm({...form,warehouseId:e.target.value})} required>
          {warehouses.map(w=><option key={w._id} value={w._id}>{w.name}</option>)}</select></div>
      <div className="form-group"><label className="label">Notes</label><textarea className="input h-16 resize-none" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
      <div className="flex gap-3"><button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving?'Starting...':'Start Audit'}</button></div>
    </form>
  );
}

export default function AuditsPage() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const res = await auditsApi.getAll({limit:20}); setAudits(res.data.data||[]); setTotal(res.data.total||0); } catch {}
    setLoading(false);
  }, []);
  useEffect(()=>{fetch();},[fetch]);

  const handleComplete = async (id) => {
    try { await auditsApi.complete(id); toast('Audit completed!','success'); fetch(); }
    catch (err) { toast(err.response?.data?.message||'Failed','error'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Inventory Audits</h1><p className="text-gray-500 text-sm">{total} audits total</p></div>
        <button className="btn-primary" onClick={()=>setModal(true)}><Plus className="w-4 h-4"/>Start Audit</button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="card animate-pulse h-24"/>)}</div>
      ) : audits.length === 0 ? (
        <div className="empty-state py-16">
          <div className="empty-icon"><ClipboardList className="w-8 h-8 text-gray-300"/></div>
          <h3 className="text-gray-500 font-semibold">No audits yet</h3>
          <p className="text-gray-400 text-sm">Start a physical inventory count to begin an audit</p>
          <button className="btn-primary mt-2" onClick={()=>setModal(true)}>Start First Audit</button>
        </div>
      ) : (
        <div className="space-y-4">
          {audits.map((audit) => (
            <div key={audit._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-6 h-6 text-brand-700"/>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{audit.auditName}</h3>
                    <div className="text-sm text-gray-500">{audit.warehouse?.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatDateTime(audit.startedAt)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={audit.status}/>
                  {audit.status === 'in_progress' && (
                    <button className="btn-success btn-sm flex items-center gap-1" onClick={()=>handleComplete(audit._id)}>
                      <CheckCircle className="w-3.5 h-3.5"/>Complete
                    </button>
                  )}
                </div>
              </div>

              {audit.items && audit.items.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {label:'Items Counted',value:audit.items.filter(i=>i.countedQty!==undefined).length},
                      {label:'Total Items',value:audit.items.length},
                      {label:'Discrepancies',value:audit.items.filter(i=>i.discrepancy&&i.discrepancy!==0).length},
                    ].map(({label,value})=>(
                      <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="font-bold text-gray-900">{value}</div>
                        <div className="text-xs text-gray-400">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={()=>setModal(false)} title="Start New Audit" size="md">
        <StartAuditForm onSave={()=>{setModal(false);fetch();}} onClose={()=>setModal(false)}/>
      </Modal>
    </div>
  );
}
