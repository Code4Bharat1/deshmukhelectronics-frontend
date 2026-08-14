'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { usersApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import StatusBadge from '../../../components/ui/StatusBadge';
import { getRoleLabel, getRoleBadgeColor, formatDate, cn } from '../../../lib/utils';

const ROLES = ['owner_admin','manager','supervisor','worker','accountant'];
const DESIGNATIONS = ['Owner & CEO','Operations Manager','Warehouse Supervisor','Dispatch Supervisor','Warehouse Associate','Packing Specialist','QC Inspector','Senior Accountant','Junior Accountant'];

function UserForm({ user, warehouses, onSave, onClose }) {
  const [form, setForm] = useState({
    name: user?.name||'', email: user?.email||'', phone: user?.phone||'',
    role: user?.role||'worker', designation: user?.designation||'',
    assignedWarehouse: user?.assignedWarehouse?._id || user?.assignedWarehouse || '',
    password: '', salaryBasic: user?.salaryStructure?.basic||20000,
    salaryHra: user?.salaryStructure?.hra||8000, salaryAllowances: user?.salaryStructure?.allowances||2000,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = {
      name: form.name, email: form.email, phone: form.phone, role: form.role,
      designation: form.designation, assignedWarehouse: form.assignedWarehouse||undefined,
      salaryStructure: { basic: Number(form.salaryBasic), hra: Number(form.salaryHra), allowances: Number(form.salaryAllowances), pfRate: 12, taxRate: 5 },
    };
    if (!user && form.password) payload.password = form.password;
    try {
      if (user) { await usersApi.update(user._id, payload); toast('User updated!','success'); }
      else { await usersApi.create(payload); toast('User created!','success'); }
      onSave();
    } catch (err) { toast(err.response?.data?.message||'Failed','error'); }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group col-span-2"><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
        <div className="form-group"><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></div>
        <div className="form-group"><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
        <div className="form-group"><label className="label">Role *</label>
          <select className="input select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
            {ROLES.map(r=><option key={r} value={r}>{getRoleLabel(r)}</option>)}</select></div>
        <div className="form-group"><label className="label">Designation</label>
          <input list="designations" className="input" value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})}/>
          <datalist id="designations">{DESIGNATIONS.map(d=><option key={d} value={d}/>)}</datalist></div>
        <div className="form-group"><label className="label">Assigned Warehouse</label>
          <select className="input select" value={form.assignedWarehouse} onChange={e=>setForm({...form,assignedWarehouse:e.target.value})}>
            <option value="">— None —</option>{warehouses.map(w=><option key={w._id} value={w._id}>{w.name}</option>)}</select></div>
        {!user && <div className="form-group"><label className="label">Password *</label><input type="password" className="input" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required={!user}/></div>}
      </div>
      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Salary Structure</h3>
        <div className="grid grid-cols-3 gap-3">
          {[['Basic (₹)','salaryBasic'],['HRA (₹)','salaryHra'],['Allowances (₹)','salaryAllowances']].map(([label,key])=>(
            <div key={key} className="form-group"><label className="label">{label}</label>
              <input type="number" className="input" value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving?'Saving...':user?'Update User':'Add User'}</button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [ur, wr] = await Promise.all([usersApi.getAll(), import('../../../lib/api').then(m=>m.warehousesApi.getAll())]);
      setUsers(ur.data.data||[]); setWarehouses(wr.data.data||[]);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleToggle = async () => {
    setToggling(true);
    try { await usersApi.toggleActive(toggleTarget._id); toast('Status updated','success'); setToggleTarget(null); fetch(); } catch {}
    setToggling(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Users & Roles</h1><p className="text-gray-500 text-sm">{users.length} team members</p></div>
        <button className="btn-primary" onClick={()=>{setEditTarget(null);setModal(true);}}><Plus className="w-4 h-4"/> Add User</button>
      </div>

      <div className="table-wrapper card p-0">
        <table className="table">
          <thead><tr><th>Name</th><th>Role</th><th>Designation</th><th>Warehouse</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? Array.from({length:5}).map((_,i)=><tr key={i}>{Array.from({length:6}).map((_,j)=><td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse"/></td>)}</tr>)
            : users.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found</td></tr>
            : users.map((u) => (
              <tr key={u._id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">{u.name?.charAt(0)}</div>
                    <div><div className="font-semibold text-gray-900">{u.name}</div><div className="text-xs text-gray-400">{u.email}</div></div>
                  </div>
                </td>
                <td><span className={cn('badge', getRoleBadgeColor(u.role))}>{getRoleLabel(u.role)}</span></td>
                <td className="text-gray-600">{u.designation||'—'}</td>
                <td className="text-gray-500 text-sm">{u.assignedWarehouse?.name||'—'}</td>
                <td><StatusBadge status={u.isActive?'active':'inactive'}/></td>
                <td>
                  <div className="flex gap-1.5">
                    <button className="btn-ghost btn-icon min-h-0 p-1.5" onClick={()=>{setEditTarget(u);setModal(true);}}><Edit2 className="w-3.5 h-3.5"/></button>
                    <button className={cn('btn-ghost btn-icon min-h-0 p-1.5', u.isActive?'hover:text-amber-600':'hover:text-emerald-600')} onClick={()=>setToggleTarget(u)}>
                      {u.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500"/> : <ToggleLeft className="w-4 h-4 text-gray-400"/>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editTarget?'Edit User':'Add User'} size="lg">
        <UserForm user={editTarget} warehouses={warehouses} onSave={()=>{setModal(false);fetch();}} onClose={()=>setModal(false)}/>
      </Modal>

      <ConfirmDialog isOpen={!!toggleTarget} onClose={()=>setToggleTarget(null)} onConfirm={handleToggle} title={toggleTarget?.isActive?'Deactivate User':'Activate User'} message={`${toggleTarget?.isActive?'Deactivate':'Activate'} "${toggleTarget?.name}"?`} confirmLabel={toggleTarget?.isActive?'Deactivate':'Activate'} confirmClass={toggleTarget?.isActive?'btn-danger':'btn-success'} loading={toggling}/>
    </div>
  );
}
