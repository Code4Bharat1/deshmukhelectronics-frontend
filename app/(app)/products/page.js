'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, QrCode, Package, Eye, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { productsApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Modal from '../../../components/ui/Modal';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatCurrency, cn } from '../../../lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

function ProductForm({ product, onSave, onClose }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || '',
    brand: product?.brand || '',
    model: product?.model || '',
    unit: product?.unit || 'pcs',
    purchasePrice: product?.purchasePrice || '',
    sellingPrice: product?.sellingPrice || '',
    minStockLevel: product?.minStockLevel || 10,
    description: product?.description || '',
    trackingType: product?.trackingType || 'quantity',
    isActive: product?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (product) {
        await productsApi.update(product._id, fd);
        toast('Product updated successfully', 'success');
      } else {
        await productsApi.create(fd);
        toast('Product created successfully', 'success');
      }
      onSave();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group col-span-2 md:col-span-1">
          <label className="label">Product Name *</label>
          <input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
        </div>
        <div className="form-group col-span-2 md:col-span-1">
          <label className="label">SKU *</label>
          <input className="input uppercase" value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value.toUpperCase()})} required disabled={!!product} />
        </div>
        <div className="form-group">
          <label className="label">Category *</label>
          <input className="input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} required />
        </div>
        <div className="form-group">
          <label className="label">Brand</label>
          <input className="input" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="label">Unit</label>
          <select className="input select" value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})}>
            {['pcs', 'roll', 'box', 'set', 'kg', 'litre', 'meter'].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Tracking Type</label>
          <select className="input select" value={form.trackingType} onChange={(e) => setForm({...form, trackingType: e.target.value})}>
            <option value="quantity">Quantity</option>
            <option value="batch">Batch</option>
            <option value="serial">Serial</option>
          </select>
        </div>
        <div className="form-group">
          <label className="label">Purchase Price (₹)</label>
          <input type="number" className="input" value={form.purchasePrice} onChange={(e) => setForm({...form, purchasePrice: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="label">Selling Price (₹)</label>
          <input type="number" className="input" value={form.sellingPrice} onChange={(e) => setForm({...form, sellingPrice: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="label">Min Stock Level</label>
          <input type="number" className="input" value={form.minStockLevel} onChange={(e) => setForm({...form, minStockLevel: Number(e.target.value)})} />
        </div>
        <div className="form-group col-span-2">
          <label className="label">Description</label>
          <textarea className="input h-20 resize-none" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
        </div>
        <div className="form-group col-span-2 flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({...form, isActive: e.target.checked})} className="w-4 h-4 accent-brand-700" />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
        </button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [qrProduct, setQrProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll({ search, lowStock: filterLowStock, page, limit: 20 });
      setProducts(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {}
    setLoading(false);
  }, [search, filterLowStock, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productsApi.delete(deleteTarget._id);
      toast('Product deactivated', 'success');
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete', 'error');
    }
    setDeleting(false);
  };

  const handleGenerateQR = async (product) => {
    try {
      await productsApi.generateQR(product._id);
      fetchProducts();
      toast('QR code regenerated', 'success');
    } catch {}
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-gray-500 text-sm">{total} products total</p>
        </div>
        <button id="add-product-btn" className="btn-primary" onClick={() => { setEditProduct(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" className="input pl-9"
            placeholder="Search by name, SKU, brand..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button
          className={cn('btn-sm flex items-center gap-2', filterLowStock ? 'btn-primary' : 'btn-secondary')}
          onClick={() => setFilterLowStock(!filterLowStock)}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {filterLowStock ? 'All Products' : 'Low Stock Only'}
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper card p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <Package className="w-8 h-8 text-gray-300" />
                  <span>No products found</span>
                </div>
              </td></tr>
            ) : products.map((p) => (
              <tr key={p._id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {p.imageUrl ? (
                        <img src={`${API_URL}${p.imageUrl}`} alt={p.name} className="w-full h-full object-cover" />
                      ) : <Package className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm max-w-[160px] truncate">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.brand}</div>
                    </div>
                  </div>
                </td>
                <td className="font-mono text-xs text-gray-600">{p.sku}</td>
                <td className="text-gray-600">{p.category}</td>
                <td>
                  <span className={cn(
                    'font-bold',
                    p.currentStock <= p.minStockLevel ? 'text-red-600' : 'text-gray-900'
                  )}>
                    {p.currentStock?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-gray-400 text-xs ml-1">{p.unit}</span>
                  {p.currentStock <= p.minStockLevel && (
                    <div className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Low
                    </div>
                  )}
                </td>
                <td className="text-xs">
                  <div>Buy: {formatCurrency(p.purchasePrice)}</div>
                  <div className="text-gray-400">Sell: {formatCurrency(p.sellingPrice)}</div>
                </td>
                <td>
                  <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                </td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <Link href={`/products/${p._id}`} className="btn-ghost btn-icon min-h-0 p-1.5 text-gray-400 hover:text-brand-700">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <button className="btn-ghost btn-icon min-h-0 p-1.5 text-gray-400 hover:text-brand-700"
                      onClick={() => { setEditProduct(p); setModalOpen(true); }}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="btn-ghost btn-icon min-h-0 p-1.5 text-gray-400 hover:text-brand-700"
                      onClick={() => setQrProduct(p)}>
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <button className="btn-ghost btn-icon min-h-0 p-1.5 text-gray-400 hover:text-red-600"
                      onClick={() => setDeleteTarget(p)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {(page-1)*20+1}–{Math.min(page*20,total)} of {total}</span>
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm" disabled={page===1} onClick={() => setPage(page-1)}>Prev</button>
            <button className="btn-secondary btn-sm" disabled={page*20>=total} onClick={() => setPage(page+1)}>Next</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'Edit Product' : 'Add New Product'} size="lg">
        <ProductForm product={editProduct} onSave={() => { setModalOpen(false); fetchProducts(); }} onClose={() => setModalOpen(false)} />
      </Modal>

      {/* QR Modal */}
      {qrProduct && (
        <Modal isOpen={!!qrProduct} onClose={() => setQrProduct(null)} title="QR Code" size="sm">
          <div className="p-6 flex flex-col items-center gap-4">
            {qrProduct.qrCodeImage ? (
              <img src={qrProduct.qrCodeImage} alt="QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
                <QrCode className="w-12 h-12 text-gray-300" />
              </div>
            )}
            <div className="text-center">
              <div className="font-bold text-gray-900">{qrProduct.name}</div>
              <div className="text-sm text-gray-500 font-mono">{qrProduct.qrCodeValue}</div>
            </div>
            <div className="flex gap-3 w-full">
              <button className="btn-secondary flex-1" onClick={() => { handleGenerateQR(qrProduct); }}>
                <QrCode className="w-4 h-4" /> Regenerate
              </button>
              <button className="btn-primary flex-1" onClick={() => window.print()}>
                🖨️ Print
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Product"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"? It won't appear in active lists.`}
        confirmLabel="Deactivate"
        loading={deleting}
      />
    </div>
  );
}
