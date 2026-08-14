'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Package, ChevronLeft, QrCode, AlertTriangle, ArrowDownToLine,
  ArrowUpFromLine, ArrowLeftRight, Clock, Building2, MapPin, Tag
} from 'lucide-react';
import { productsApi } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const [prodRes, movRes] = await Promise.all([
          productsApi.getById(id),
          productsApi.getMovements(id, { limit: 15 }),
        ]);
        setProduct(prodRes.data.data);
        setMovements(movRes.data.data || []);
      } catch (err) {
        toast('Failed to load product details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card h-64 bg-gray-200" />
          <div className="card md:col-span-2 h-64 bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty-state py-20 text-center">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-800">Product not found</h2>
        <button onClick={() => router.back()} className="btn-secondary mt-4">
          <ChevronLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const isLowStock = product.currentStock <= product.minStockLevel;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="btn-ghost btn-sm flex items-center gap-1 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Products
        </button>
        <StatusBadge status={product.isActive ? 'active' : 'inactive'} />
      </div>

      {/* Main Product Info Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Image & QR */}
        <div className="card flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-40 h-40 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
            {product.imageUrl ? (
              <img src={`${API_URL}${product.imageUrl}`} alt={product.name} className="w-full h-full object-cover" />
            ) : product.qrCodeImage ? (
              <img src={product.qrCodeImage} alt="QR Code" className="w-36 h-36" />
            ) : (
              <Package className="w-16 h-16 text-gray-300" />
            )}
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full inline-block">
              {product.sku}
            </div>
            {product.qrCodeValue && (
              <div className="text-[11px] text-gray-400 mt-1">QR: {product.qrCodeValue}</div>
            )}
          </div>
        </div>

        {/* Right: Overview & Pricing */}
        <div className="card md:col-span-2 space-y-5 p-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
              <span>{product.brand || 'Unbranded'}</span>
              <span>•</span>
              <span>{product.category}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            {product.description && (
              <p className="text-sm text-gray-600 mt-2">{product.description}</p>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <div className="text-xs text-gray-500 font-medium">Current Stock</div>
              <div className={cn('text-2xl font-bold mt-0.5', isLowStock ? 'text-red-600' : 'text-gray-900')}>
                {product.currentStock?.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-gray-400">{product.unit}</span>
              </div>
              {isLowStock && (
                <div className="text-[11px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> Below Min ({product.minStockLevel})
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <div className="text-xs text-gray-500 font-medium">Purchase Price</div>
              <div className="text-lg font-bold text-gray-800 mt-0.5">
                {formatCurrency(product.purchasePrice)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <div className="text-xs text-gray-500 font-medium">Selling Price</div>
              <div className="text-lg font-bold text-brand-700 mt-0.5">
                {formatCurrency(product.sellingPrice)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <div className="text-xs text-gray-500 font-medium">Tracking Type</div>
              <div className="text-sm font-bold text-gray-800 capitalize mt-1">
                {product.trackingType || 'Quantity'}
              </div>
            </div>
          </div>

          {/* Warehouse Breakdown */}
          {product.warehouseStock && product.warehouseStock.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Stock Breakdown by Warehouse
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {product.warehouseStock.map((ws) => (
                  <div key={ws.warehouse?._id || ws.warehouse} className="p-2.5 bg-brand-50/50 border border-brand-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">{ws.warehouse?.name || 'Warehouse'}</span>
                    <span className="text-sm font-bold text-brand-800">{ws.quantity} {product.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Movement History Table */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Movement History</h2>
            <p className="text-xs text-gray-500">Audit trail of all receipts, dispatches, transfers and adjustments</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Quantity</th>
                <th>From / To</th>
                <th>Performed By</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No movement records found for this product
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <StatusBadge status={m.type} />
                    </td>
                    <td className="font-bold">
                      {m.type === 'incoming' ? '+' : m.type === 'outgoing' ? '-' : ''}
                      {m.quantity} <span className="text-xs text-gray-400 font-normal">{product.unit}</span>
                    </td>
                    <td className="text-xs">
                      {m.fromWarehouse && <div className="text-gray-500">From: {m.fromWarehouse.name}</div>}
                      {m.toWarehouse && <div className="text-gray-800 font-medium">To: {m.toWarehouse.name}</div>}
                      {m.supplier && <div className="text-gray-500">Supplier: {m.supplier.name}</div>}
                      {m.customer && <div className="text-gray-500">Customer: {m.customer.name}</div>}
                    </td>
                    <td className="text-gray-600 text-sm">{m.performedBy?.name || '—'}</td>
                    <td className="text-gray-400 text-xs">{formatDateTime(m.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
