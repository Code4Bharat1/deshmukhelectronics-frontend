'use client';
import { useState, useEffect } from 'react';
import {
  Target, X, Calendar, Clock, AlertTriangle, User,
  Package, Building, UserCheck, Flame, CheckCircle
} from 'lucide-react';
import Modal from '../ui/Modal';
import { productsApi, customersApi, warehousesApi, usersApi, goalsApi } from '../../lib/api';
import useAuthStore from '../../lib/authStore';

export default function AssignGoalModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [form, setForm] = useState({
    title: '',
    productId: '',
    quantity: 1,
    customerId: '',
    warehouseId: '',
    assignedWorkerIds: [],
    deadline: '',
    priority: 'normal',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setError('');
      loadDependencies();
      // Set default deadline to now + 4 hours
      const defaultDate = new Date(Date.now() + 4 * 3600000);
      defaultDate.setMinutes(Math.ceil(defaultDate.getMinutes() / 15) * 15, 0, 0);
      const isoStr = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setForm({
        title: '',
        productId: '',
        quantity: 1,
        customerId: '',
        warehouseId: user?.assignedWarehouse?._id || user?.assignedWarehouse || '',
        assignedWorkerIds: [],
        deadline: isoStr,
        priority: 'normal',
        notes: '',
      });
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    setLoadingInitial(true);
    try {
      const [prodRes, custRes, whRes, userRes] = await Promise.all([
        productsApi.getAll({ limit: 100 }),
        customersApi.getAll({ limit: 100 }),
        warehousesApi.getAll(),
        usersApi.getAll({ limit: 100 }),
      ]);
      setProducts(prodRes.data.data || []);
      setCustomers(custRes.data.data || []);
      setWarehouses(whRes.data.data || []);
      
      const allUsers = userRes.data.data || [];
      const staffWorkers = allUsers.filter((u) => u.role === 'worker' || u.role === 'supervisor');
      setWorkers(staffWorkers);

      if (!form.warehouseId && whRes.data.data?.length > 0) {
        setForm((prev) => ({ ...prev, warehouseId: whRes.data.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load goal dependencies:', err);
      setError('Failed to load products/customers data.');
    } finally {
      setLoadingInitial(false);
    }
  };

  const selectedProduct = products.find((p) => p._id === form.productId);
  const selectedWarehouse = warehouses.find((w) => w._id === form.warehouseId);

  const setQuickDeadline = (hoursFromNow, labelHour = null) => {
    const d = new Date();
    if (labelHour !== null) {
      d.setHours(labelHour, 0, 0, 0);
      if (d < new Date()) {
        d.setDate(d.getDate() + 1);
      }
    } else {
      d.setTime(d.getTime() + hoursFromNow * 3600000);
    }
    const isoStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setForm((prev) => ({ ...prev, deadline: isoStr }));
  };

  const handleWorkerToggle = (workerId) => {
    setForm((prev) => {
      const exists = prev.assignedWorkerIds.includes(workerId);
      return {
        ...prev,
        assignedWorkerIds: exists
          ? prev.assignedWorkerIds.filter((id) => id !== workerId)
          : [...prev.assignedWorkerIds, workerId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.productId) {
      setError('Please select a product to dispatch');
      return;
    }
    if (!form.quantity || form.quantity < 1) {
      setError('Please enter a valid quantity (min 1)');
      return;
    }
    if (!form.customerId) {
      setError('Please select the destination customer');
      return;
    }
    if (!form.warehouseId) {
      setError('Please select the dispatch warehouse');
      return;
    }
    if (!form.deadline) {
      setError('Please set a deadline date and time');
      return;
    }

    setSubmitting(true);
    try {
      const cust = customers.find((c) => c._id === form.customerId);
      const prod = products.find((p) => p._id === form.productId);
      const customTitle = form.title || `Dispatch ${prod?.name || 'Product'} to ${cust?.name || 'Customer'}`;

      await goalsApi.create({
        title: customTitle,
        productId: form.productId,
        quantity: Number(form.quantity),
        customerId: form.customerId,
        warehouseId: form.warehouseId,
        assignedWorkerIds: form.assignedWorkerIds,
        deadline: new Date(form.deadline).toISOString(),
        priority: form.priority,
        notes: form.notes,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Create goal error:', err);
      setError(err.response?.data?.message || 'Failed to create goal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign New Dispatch Goal" size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Priority Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            Priority Level & Urgency
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'normal', label: 'Normal', icon: CheckCircle, color: 'border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50' },
              { id: 'high', label: 'High Priority', icon: AlertTriangle, color: 'border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-50' },
              { id: 'urgent', label: '🔥 Urgent Alert', icon: Flame, color: 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 font-bold' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setForm({ ...form, priority: p.id })}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-xs transition-all ${p.color} ${
                  form.priority === p.id ? 'ring-2 ring-brand-600 border-transparent shadow-sm scale-[1.02]' : 'opacity-80'
                }`}
              >
                <p.icon className="w-4 h-4" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-brand-600" />
              Select Product <span className="text-red-500">*</span>
            </label>
            <select
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku}) — Stock: {p.currentStock} {p.unit || 'pcs'}
                </option>
              ))}
            </select>
            {selectedProduct && (
              <div className="text-[11px] text-gray-500 flex justify-between pt-0.5">
                <span>Category: {selectedProduct.category}</span>
                <span className="font-semibold text-emerald-700">Available: {selectedProduct.currentStock} {selectedProduct.unit}</span>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              Quantity to Dispatch <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input w-full"
                placeholder="e.g. 50"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                {selectedProduct?.unit || 'units'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer / Client */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-brand-600" />
              Destination Customer / Client <span className="text-red-500">*</span>
            </label>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.city || 'Pune'})
                </option>
              ))}
            </select>
          </div>

          {/* Warehouse */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-brand-600" />
              Dispatch Warehouse <span className="text-red-500">*</span>
            </label>
            <select
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">-- Choose Warehouse --</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} ({w.location})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Deadline Date & Time */}
        <div className="space-y-1.5 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Target Deadline <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-gray-400">Workers will get alerts before this time</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="input flex-1 bg-white font-medium"
              required
            />
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-gray-400 self-center mr-1">Quick Presets:</span>
            <button
              type="button"
              onClick={() => setQuickDeadline(2)}
              className="text-[11px] px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 hover:border-brand-500 hover:text-brand-700 min-h-0"
            >
              ⚡ In 2 Hours
            </button>
            <button
              type="button"
              onClick={() => setQuickDeadline(4)}
              className="text-[11px] px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 hover:border-brand-500 hover:text-brand-700 min-h-0"
            >
              In 4 Hours
            </button>
            <button
              type="button"
              onClick={() => setQuickDeadline(null, 18)}
              className="text-[11px] px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 hover:border-brand-500 hover:text-brand-700 min-h-0"
            >
              Today 6:00 PM
            </button>
            <button
              type="button"
              onClick={() => setQuickDeadline(24)}
              className="text-[11px] px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 hover:border-brand-500 hover:text-brand-700 min-h-0"
            >
              Tomorrow
            </button>
          </div>
        </div>

        {/* Assigned Workers */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-600" />
              Assign to Specific Workers (Optional)
            </label>
            <span className="text-[11px] text-gray-400">
              {form.assignedWorkerIds.length === 0 ? 'Visible to all warehouse workers' : `${form.assignedWorkerIds.length} worker(s) selected`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100">
            {workers.map((w) => {
              const isSelected = form.assignedWorkerIds.includes(w._id);
              return (
                <button
                  key={w._id}
                  type="button"
                  onClick={() => handleWorkerToggle(w._id)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-brand-100 text-brand-900 font-semibold border border-brand-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isSelected ? 'bg-brand-700 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {w.name.charAt(0)}
                  </div>
                  <div className="truncate min-w-0">
                    <div className="truncate">{w.name}</div>
                    <div className="text-[10px] text-gray-400 capitalize">{w.designation || w.role}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Notes */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">
            Special Instructions / Dispatch Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input w-full resize-none py-2 text-sm"
            rows="2"
            placeholder="e.g. Priority packaging required. Add tamper-evident seal."
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Assigning Goal...</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                <span>Assign Goal to Workers</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
