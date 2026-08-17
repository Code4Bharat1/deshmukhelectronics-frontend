'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  QrCode, Package, ArrowRight, CheckCircle, XCircle,
  AlertTriangle, ChevronLeft, Plus, Minus, Camera, Type,
  RotateCcw, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  Building, User, RefreshCw, Zap
} from 'lucide-react';
import { productsApi, stockApi, warehousesApi, suppliersApi, customersApi, returnsApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import useAuthStore from '@/lib/authStore';

const ACTIONS = [
  { value: 'outgoing', label: 'Outgoing', icon: ArrowUpFromLine, color: 'bg-orange-600 text-white shadow-sm', activeBorder: 'border-orange-500' },
  { value: 'incoming', label: 'Incoming', icon: ArrowDownToLine, color: 'bg-emerald-600 text-white shadow-sm', activeBorder: 'border-emerald-500' },
  { value: 'transfer', label: 'Transfer', icon: ArrowLeftRight, color: 'bg-blue-600 text-white shadow-sm', activeBorder: 'border-blue-500' },
  { value: 'return', label: 'Return', icon: RotateCcw, color: 'bg-purple-600 text-white shadow-sm', activeBorder: 'border-purple-500' },
  { value: 'damaged', label: 'Damaged', icon: AlertTriangle, color: 'bg-red-600 text-white shadow-sm', activeBorder: 'border-red-500' },
];

function QuickScanPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  // State
  const [manualMode, setManualMode] = useState(false);
  const [skuSearch, setSkuSearch] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [action, setAction] = useState(searchParams.get('action') || 'outgoing');
  const [quantity, setQuantity] = useState(1);

  // Locations / Parties
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedFrom, setSelectedFrom] = useState('');
  const [selectedTo, setSelectedTo] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [reason, setReason] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [stockError, setStockError] = useState('');
  const [lastSuccess, setLastSuccess] = useState(null);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, whRes, supRes, custRes] = await Promise.all([
          productsApi.getAll({ limit: 100 }),
          warehousesApi.getAll(),
          suppliersApi.getAll({ limit: 100 }),
          customersApi.getAll({ limit: 100 }),
        ]);
        setAllProducts(prodRes.data.data || []);
        const whs = whRes.data.data || [];
        setWarehouses(whs);
        setSuppliers(supRes.data.data || []);
        setCustomers(custRes.data.data || []);

        const defaultWh = user?.assignedWarehouse?._id || user?.assignedWarehouse || (whs.length > 0 ? whs[0]._id : '');
        setSelectedWarehouse(defaultWh);
        setSelectedFrom(defaultWh);
        setSelectedTo(whs.length > 1 ? (whs[0]._id === defaultWh ? whs[1]._id : whs[0]._id) : defaultWh);
      } catch (err) {
        console.error('Failed to load scan options:', err);
      }
    };
    fetchData();

    if (searchParams.get('action')) {
      setAction(searchParams.get('action'));
    }
  }, []);

  useEffect(() => {
    if (!manualMode && !product && typeof window !== 'undefined') {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [manualMode, product]);

  const startScanner = async () => {
    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      if (scannerRef.current && !html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
          false
        );
        html5QrCodeRef.current.render(
          (decodedText) => handleScanSuccess(decodedText),
          () => {}
        );
      }
    } catch (err) {
      console.error('Scanner init error:', err);
      setManualMode(true);
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      try { html5QrCodeRef.current.clear(); } catch {}
      html5QrCodeRef.current = null;
    }
  };

  const handleScanSuccess = async (text) => {
    stopScanner();
    const cleanSku = text.replace('DESHMUKH-', '').trim();
    lookupProduct(cleanSku);
  };

  const lookupProduct = async (skuOrId) => {
    setStockError('');
    try {
      // Find from loaded list or call API
      const found = allProducts.find(
        (p) => p.sku?.toUpperCase() === skuOrId?.toUpperCase() || p._id === skuOrId
      );
      if (found) {
        setProduct(found);
        setQuantity(1);
        toast(`Identified: ${found.name}`, 'success');
        return;
      }

      const res = await productsApi.getBySKU(skuOrId);
      if (res.data.data) {
        setProduct(res.data.data);
        setQuantity(1);
        toast(`Identified: ${res.data.data.name}`, 'success');
      } else {
        toast('Product not found for this code', 'error');
      }
    } catch {
      toast('Product not found. Please select from list.', 'error');
    }
  };

  const handleManualSelect = (e) => {
    const pId = e.target.value;
    setSkuSearch(pId);
    if (!pId) {
      setProduct(null);
      return;
    }
    const found = allProducts.find((p) => p._id === pId);
    if (found) {
      setProduct(found);
      setQuantity(1);
    }
  };

  const handleResetForNext = () => {
    setProduct(null);
    setSkuSearch('');
    setQuantity(1);
    setStockError('');
    setLastSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) {
      toast('Please scan or select a product first', 'error');
      return;
    }
    if (quantity <= 0) {
      toast('Quantity must be greater than 0', 'error');
      return;
    }

    if (action === 'outgoing' && quantity > (product.currentStock || 0)) {
      setStockError(`Insufficient stock! Available in stock: ${product.currentStock} ${product.unit}`);
      toast('Insufficient stock', 'error');
      return;
    }

    setSubmitting(true);
    setStockError('');

    try {
      if (action === 'incoming') {
        await stockApi.createIncoming({
          productId: product._id,
          warehouseId: selectedWarehouse,
          quantity: Number(quantity),
          supplierId: selectedSupplier || undefined,
        });
      } else if (action === 'outgoing') {
        await stockApi.createOutgoing({
          productId: product._id,
          warehouseId: selectedWarehouse,
          quantity: Number(quantity),
          customerId: selectedCustomer || undefined,
        });
      } else if (action === 'transfer') {
        await stockApi.createTransfer({
          productId: product._id,
          fromWarehouseId: selectedFrom,
          toWarehouseId: selectedTo,
          quantity: Number(quantity),
        });
      } else if (action === 'damaged') {
        await stockApi.createDamaged({
          productId: product._id,
          warehouseId: selectedWarehouse,
          quantity: Number(quantity),
          reason: reason || 'Reported damaged via QR Scan',
        });
      } else if (action === 'return') {
        await returnsApi.create({
          productId: product._id,
          warehouseId: selectedWarehouse,
          quantity: Number(quantity),
          customerId: selectedCustomer || undefined,
          reason: reason || 'Customer Return',
          disposition: 'restock',
        });
      }

      setLastSuccess({
        productName: product.name,
        quantity,
        unit: product.unit || 'pcs',
        action,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });

      toast(`Successfully recorded ${action} movement!`, 'success');
      
      // Update local product stock in list
      setAllProducts((prev) =>
        prev.map((p) => {
          if (p._id === product._id) {
            const diff = action === 'incoming' || action === 'return' ? Number(quantity) : -Number(quantity);
            return { ...p, currentStock: Math.max(0, (p.currentStock || 0) + diff) };
          }
          return p;
        })
      );
      setProduct((prev) => {
        if (!prev) return null;
        const diff = action === 'incoming' || action === 'return' ? Number(quantity) : -Number(quantity);
        return { ...prev, currentStock: Math.max(0, (prev.currentStock || 0) + diff) };
      });

    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record stock movement';
      setStockError(msg);
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentAction = ACTIONS.find((a) => a.value === action) || ACTIONS[0];
  const isOutgoing = action === 'outgoing';
  const isStockLow = isOutgoing && product && quantity > (product.currentStock || 0);

  return (
    <div className="max-w-md mx-auto space-y-4 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/worker')}
          className="btn-ghost btn-icon p-2 -ml-2 text-gray-500 hover:text-gray-800"
          title="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-1">
          <h1 className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            Quick Stock Scan
          </h1>
          <p className="text-[11px] text-gray-400">All-in-one 1-step stock entry</p>
        </div>
        <button
          onClick={() => {
            stopScanner();
            setManualMode(!manualMode);
          }}
          className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200"
        >
          {manualMode ? '📷 Camera' : '⌨️ Search'}
        </button>
      </div>

      {/* Success Notification Banner */}
      {lastSuccess && (
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-scale-up">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950 capitalize">
                {lastSuccess.action} Recorded: {lastSuccess.quantity} {lastSuccess.unit}
              </div>
              <div className="text-[11px] text-emerald-700 truncate max-w-[200px]">
                {lastSuccess.productName} ({lastSuccess.time})
              </div>
            </div>
          </div>
          <button
            onClick={handleResetForNext}
            className="btn-primary text-xs py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-800 shrink-0"
          >
            Scan Next ⚡
          </button>
        </div>
      )}

      {/* 1. Camera / Manual Product Selector */}
      <div className="card p-3 space-y-3">
        {!product ? (
          <div>
            {!manualMode ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-brand-600" /> Point Camera at QR Code
                  </span>
                  <span className="text-[10px] text-gray-400">Auto-detects</span>
                </div>
                <div className="overflow-hidden rounded-xl bg-black border border-gray-200">
                  <div id="qr-reader" ref={scannerRef} className="w-full" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-brand-600" /> Select Product
                </label>
                <select
                  value={skuSearch}
                  onChange={handleManualSelect}
                  className="input w-full text-xs font-medium"
                >
                  <option value="">-- Choose or Search Product --</option>
                  {allProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku}) — Stock: {p.currentStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          /* Identified Product Header Card */
          <div className="flex items-center justify-between p-3 bg-brand-50/70 border border-brand-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                📦
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 truncate">{product.name}</div>
                <div className="text-xs text-gray-500">
                  SKU: <span className="font-mono font-semibold">{product.sku}</span> ·{' '}
                  <span className="text-emerald-700 font-bold">
                    Stock: {product.currentStock} {product.unit || 'pcs'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetForNext}
              className="text-xs text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white"
              title="Rescan"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 2. Action Selector (Fast Pills) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            Select Operation
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {ACTIONS.map((a) => {
              const isSelected = action === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAction(a.value)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                    isSelected
                      ? `${a.color} scale-[1.02] ring-2 ring-brand-700 border-transparent`
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <a.icon className="w-4 h-4 mb-0.5" />
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Quantity Stepper */}
        <div className="card p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Quantity to {currentAction.label}
            </label>
            {product && (
              <span className="text-xs text-gray-500 font-medium">
                Available: <strong className="text-gray-900">{product.currentStock} {product.unit}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg active:scale-95 transition-all"
            >
              <Minus className="w-5 h-5 text-gray-700" />
            </button>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="text-2xl font-black text-center w-24 py-1.5 border-b-2 border-brand-700 bg-transparent focus:outline-none"
              required
            />

            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-12 rounded-xl bg-brand-100 hover:bg-brand-200 text-brand-800 flex items-center justify-center text-lg active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {[5, 10, 25, 50].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQuantity(n)}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                +{n}
              </button>
            ))}
            {product?.currentStock > 0 && isOutgoing && (
              <button
                type="button"
                onClick={() => setQuantity(product.currentStock)}
                className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 hover:bg-orange-200"
              >
                Max ({product.currentStock})
              </button>
            )}
          </div>

          {isStockLow && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-bold text-center">
              ⚠️ Warning: Quantity exceeds available warehouse stock!
            </div>
          )}
        </div>

        {/* 4. Warehouse & Party Context Fields */}
        <div className="card p-3.5 space-y-3">
          {action === 'transfer' ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-600">From Warehouse</label>
                <select
                  value={selectedFrom}
                  onChange={(e) => setSelectedFrom(e.target.value)}
                  className="input w-full text-xs py-1.5"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-600">To Warehouse</label>
                <select
                  value={selectedTo}
                  onChange={(e) => setSelectedTo(e.target.value)}
                  className="input w-full text-xs py-1.5"
                  required
                >
                  {warehouses.filter((w) => w._id !== selectedFrom).map((w) => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-600">Warehouse</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="input w-full text-xs py-1.5"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {action === 'incoming' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600">Supplier (Optional)</label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="input w-full text-xs py-1.5"
                  >
                    <option value="">-- Direct --</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {action === 'outgoing' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600">Customer (Optional)</label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="input w-full text-xs py-1.5"
                  >
                    <option value="">-- Walk-in / Order --</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {(action === 'damaged' || action === 'return') && (
            <div className="space-y-1 pt-1 border-t border-gray-100">
              <label className="text-[11px] font-semibold text-gray-600">Reason / Notes</label>
              <input
                type="text"
                placeholder={action === 'damaged' ? 'e.g. Broken seal, water damage' : 'e.g. Excess return from site'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input w-full text-xs py-1.5"
                required
              />
            </div>
          )}
        </div>

        {stockError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{stockError}</span>
          </div>
        )}

        {/* 5. Big 1-Click Submit Button */}
        <button
          type="submit"
          disabled={!product || isStockLow || submitting}
          className={`w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
            !product
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isStockLow
              ? 'bg-red-400 cursor-not-allowed'
              : action === 'outgoing'
              ? 'bg-orange-600 hover:bg-orange-700'
              : action === 'incoming'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : action === 'transfer'
              ? 'bg-blue-600 hover:bg-blue-700'
              : action === 'return'
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving Movement...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>
                {product
                  ? `Record ${currentAction.label} (${quantity} ${product.unit || 'pcs'})`
                  : 'Scan or Select Product First'}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function QuickScanPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>}>
      <QuickScanPageInner />
    </Suspense>
  );
}
