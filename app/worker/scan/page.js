'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  QrCode, Package, ArrowRight, CheckCircle, XCircle,
  AlertTriangle, ChevronLeft, Plus, Minus, Camera, Type
} from 'lucide-react';
import { productsApi, stockApi, warehousesApi, suppliersApi, customersApi, returnsApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

const STEPS = ['Scan', 'Identify', 'Action', 'Quantity', 'Confirm'];
const ACTIONS = [
  { value: 'incoming', label: 'Incoming', color: 'bg-emerald-50 border-emerald-500 text-emerald-700', icon: '📥' },
  { value: 'outgoing', label: 'Outgoing', color: 'bg-orange-50 border-orange-500 text-orange-700', icon: '📤' },
  { value: 'transfer', label: 'Transfer', color: 'bg-blue-50 border-blue-500 text-blue-700', icon: '🔄' },
  { value: 'return', label: 'Return', color: 'bg-purple-50 border-purple-500 text-purple-700', icon: '↩️' },
  { value: 'damaged', label: 'Damaged', color: 'bg-red-50 border-red-500 text-red-700', icon: '⚠️' },
];

function ScanPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=Scan 1=Identify 2=Action 3=Qty 4=Confirm
  const [manualEntry, setManualEntry] = useState(false);
  const [sku, setSku] = useState('');
  const [product, setProduct] = useState(null);
  const [action, setAction] = useState(searchParams.get('action') || '');
  const [quantity, setQuantity] = useState(1);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedFrom, setSelectedFrom] = useState('');
  const [selectedTo, setSelectedTo] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stockError, setStockError] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Load supporting data
    const fetchData = async () => {
      try {
        const [whRes, supRes, custRes] = await Promise.all([
          warehousesApi.getAll(),
          suppliersApi.getAll(),
          customersApi.getAll(),
        ]);
        setWarehouses(whRes.data.data || []);
        setSuppliers(supRes.data.data || []);
        setCustomers(custRes.data.data || []);
        if ((whRes.data.data || []).length > 0) {
          setSelectedWarehouse(whRes.data.data[0]._id);
          setSelectedFrom(whRes.data.data[0]._id);
          setSelectedTo(whRes.data.data.length > 1 ? whRes.data.data[1]._id : whRes.data.data[0]._id);
        }
      } catch {}
    };
    fetchData();

    if (searchParams.get('action')) {
      setAction(searchParams.get('action'));
    }
  }, []);

  useEffect(() => {
    if (step === 0 && !manualEntry && typeof window !== 'undefined') {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [step, manualEntry]);

  const startScanner = async () => {
    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      if (scannerRef.current && !html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          false
        );
        html5QrCodeRef.current.render(
          (decodedText) => handleScanSuccess(decodedText),
          () => {}
        );
      }
    } catch (err) {
      console.error('Scanner init error:', err);
      setManualEntry(true);
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
    const extractedSKU = text.replace('DESHMUKH-', '').trim();
    await lookupProduct(extractedSKU);
  };

  const lookupProduct = async (skuValue) => {
    setLoading(true);
    try {
      const res = await productsApi.getBySKU(skuValue || sku);
      setProduct(res.data.data);
      setStep(1);
    } catch {
      toast('Product not found for this SKU/QR', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!product || !action || quantity <= 0) return;
    setStockError('');
    setLoading(true);

    try {
      if (action === 'incoming') {
        await stockApi.createIncoming({
          productId: product._id,
          warehouseId: selectedWarehouse,
          quantity,
          supplierId: selectedSupplier || undefined,
        });
      } else if (action === 'outgoing') {
        await stockApi.createOutgoing({
          productId: product._id,
          warehouseId: selectedWarehouse,
          quantity,
          customerId: selectedCustomer || undefined,
        });
      } else if (action === 'transfer') {
        await stockApi.createTransfer({
          productId: product._id,
          fromWarehouseId: selectedFrom,
          toWarehouseId: selectedTo,
          quantity,
        });
      } else if (action === 'damaged') {
        await stockApi.createDamaged({
          productId: product._id,
          warehouseId: selectedWarehouse,
          quantity,
          reason: reason || 'Damage reported',
        });
      } else if (action === 'return') {
        await returnsApi.create({
          productId: product._id,
          warehouseId: selectedWarehouse,
          quantity,
          customerId: selectedCustomer || undefined,
          reason: reason || 'Return',
          disposition: 'restock',
        });
      }
      setSuccess(true);
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record movement';
      setStockError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0); setProduct(null); setAction(''); setQuantity(1);
    setSku(''); setManualEntry(false); setSuccess(false); setStockError('');
  };

  // Step 0: Scan
  if (step === 0) {
    return (
      <div className="max-w-md mx-auto space-y-5 animate-fade-in">
        <ProgressBar current={0} total={5} />
        <h1 className="text-xl font-bold text-gray-900">Scan QR Code</h1>

        {!manualEntry ? (
          <div className="card p-0 overflow-hidden">
            <div id="qr-reader" ref={scannerRef} className="w-full" />
          </div>
        ) : (
          <div className="card space-y-4">
            <h2 className="font-bold text-gray-800">Manual SKU Entry</h2>
            <input
              type="text"
              className="input"
              placeholder="Enter SKU (e.g. WIRE-4MM-100)"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              autoFocus
            />
            <button
              className="btn-primary w-full"
              onClick={() => lookupProduct(sku)}
              disabled={!sku.trim() || loading}
            >
              {loading ? 'Searching...' : 'Find Product'}
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button
            className="flex-1 btn-secondary flex items-center gap-2 justify-center"
            onClick={() => { stopScanner(); setManualEntry(!manualEntry); }}
          >
            {manualEntry ? <Camera className="w-4 h-4" /> : <Type className="w-4 h-4" />}
            {manualEntry ? 'Use Camera' : 'Manual Entry'}
          </button>
          <button className="btn-ghost" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Identify Product
  if (step === 1) {
    return (
      <div className="max-w-md mx-auto space-y-5 animate-fade-in">
        <ProgressBar current={1} total={5} />
        <h1 className="text-xl font-bold text-gray-900">Product Found</h1>
        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl overflow-hidden">
              {product?.imageUrl ? (
                <img src={`http://localhost:5000${product.imageUrl}`} alt={product.name} className="w-full h-full object-cover" />
              ) : '📦'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{product?.name}</h2>
              <p className="text-gray-500 text-sm">SKU: {product?.sku}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-0.5">Current Stock</div>
              <div className="text-xl font-bold text-gray-900">{product?.currentStock?.toLocaleString('en-IN')}</div>
              <div className="text-xs text-gray-400">{product?.unit}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-0.5">Category</div>
              <div className="text-sm font-semibold text-gray-700">{product?.category}</div>
              <div className="text-xs text-gray-400">{product?.brand}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => { setStep(0); setProduct(null); }}>
            ← Rescan
          </button>
          <button className="btn-primary flex-1" onClick={() => action ? setStep(2) : setStep(2)}>
            Yes, continue →
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Select Action
  if (step === 2) {
    return (
      <div className="max-w-md mx-auto space-y-5 animate-fade-in">
        <ProgressBar current={2} total={5} />
        <h1 className="text-xl font-bold text-gray-900">Select Action</h1>
        <div className="space-y-3">
          {ACTIONS.map((a) => (
            <button
              key={a.value}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-150 ${
                action === a.value ? a.color + ' ring-2 ring-offset-1' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => { setAction(a.value); setStep(3); }}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="font-bold text-base">{a.label}</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </button>
          ))}
        </div>
        <button className="btn-secondary w-full" onClick={() => setStep(1)}>← Back</button>
      </div>
    );
  }

  // Step 3: Enter Quantity
  if (step === 3) {
    const actionObj = ACTIONS.find((a) => a.value === action);
    const needsReason = action === 'damaged' || action === 'return';
    const isOutgoing = action === 'outgoing';
    const stockWarning = isOutgoing && quantity > (product?.currentStock || 0);

    return (
      <div className="max-w-md mx-auto space-y-5 animate-fade-in">
        <ProgressBar current={3} total={5} />
        <h1 className="text-xl font-bold text-gray-900">Enter Details</h1>

        {/* Quantity Stepper */}
        <div className="card">
          <div className="text-sm font-semibold text-gray-600 mb-3">Quantity ({product?.unit})</div>
          <div className="flex items-center gap-4 justify-center">
            <button
              className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-2xl"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="text-3xl font-bold text-center w-28 border-b-2 border-brand-700 bg-transparent focus:outline-none"
            />
            <button
              className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center hover:bg-brand-200 transition-colors text-brand-700"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {isOutgoing && (
            <div className={`mt-3 text-sm text-center ${stockWarning ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
              Available: {product?.currentStock?.toLocaleString('en-IN')} {product?.unit}
              {stockWarning && ' ⚠️ Insufficient stock!'}
            </div>
          )}
        </div>

        {/* Warehouse / Party selectors */}
        {(action === 'incoming' || action === 'outgoing' || action === 'damaged') && (
          <div className="card space-y-3">
            <div className="form-group">
              <label className="label">Warehouse</label>
              <select className="input select" value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)}>
                {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
            {action === 'incoming' && (
              <div className="form-group">
                <label className="label">Supplier (optional)</label>
                <select className="input select" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                  <option value="">— Select Supplier —</option>
                  {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {action === 'outgoing' && (
              <div className="form-group">
                <label className="label">Customer (optional)</label>
                <select className="input select" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
                  <option value="">— Select Customer —</option>
                  {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {action === 'transfer' && (
          <div className="card space-y-3">
            <div className="form-group">
              <label className="label">From Warehouse</label>
              <select className="input select" value={selectedFrom} onChange={(e) => setSelectedFrom(e.target.value)}>
                {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">To Warehouse</label>
              <select className="input select" value={selectedTo} onChange={(e) => setSelectedTo(e.target.value)}>
                {warehouses.filter((w) => w._id !== selectedFrom).map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {needsReason && (
          <div className="card">
            <div className="form-group">
              <label className="label">Reason</label>
              <input type="text" className="input" placeholder="Enter reason..." value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setStep(2)}>← Back</button>
          <button
            className="btn-primary flex-1"
            onClick={() => setStep(4)}
            disabled={stockWarning || quantity <= 0}
          >
            Review →
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Confirm (or Success)
  if (success) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center gap-6 py-16 animate-fade-in text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse-soft">
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Done! 🎉</h2>
          <p className="text-gray-500 mt-1">Movement recorded successfully</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 w-full text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Product</span>
            <span className="font-semibold">{product?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Action</span>
            <span className="font-semibold capitalize">{action}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Quantity</span>
            <span className="font-semibold">{quantity} {product?.unit}</span>
          </div>
        </div>
        <div className="flex gap-3 w-full">
          <button className="btn-secondary flex-1" onClick={reset}>Scan Another</button>
          <button className="btn-primary flex-1" onClick={() => router.push('/worker')}>Back to Home</button>
        </div>
      </div>
    );
  }

  // Confirm step
  const actionObj = ACTIONS.find((a) => a.value === action);
  return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in">
      <ProgressBar current={4} total={5} />
      <h1 className="text-xl font-bold text-gray-900">Confirm Action</h1>

      {stockError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-800 text-sm">Action Blocked</div>
            <div className="text-red-700 text-sm">{stockError}</div>
          </div>
        </div>
      )}

      <div className="card space-y-3">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{actionObj?.icon}</span>
          <span className="text-lg font-bold text-gray-900 capitalize">{action}</span>
        </div>
        {[
          ['Product', product?.name],
          ['SKU', product?.sku],
          ['Quantity', `${quantity} ${product?.unit}`],
          ['Current Stock', `${product?.currentStock} ${product?.unit}`],
          action === 'transfer' ? ['From → To', `${warehouses.find(w=>w._id===selectedFrom)?.name} → ${warehouses.find(w=>w._id===selectedTo)?.name}`] : null,
          (action === 'incoming' || action === 'outgoing' || action === 'damaged') ? ['Warehouse', warehouses.find(w=>w._id===selectedWarehouse)?.name] : null,
          reason ? ['Reason', reason] : null,
        ].filter(Boolean).map(([k, v]) => (
          <div key={k} className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
            <span className="text-gray-500">{k}</span>
            <span className="font-semibold text-gray-900 text-right max-w-[60%] truncate">{v || '—'}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button className="btn-secondary flex-1" onClick={() => setStep(3)} disabled={loading}>← Edit</button>
        <button
          className="btn-primary flex-1 btn-lg"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : '✓ Confirm'}
        </button>
      </div>
    </div>
  );
}

function ProgressBar({ current, total }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Step {current + 1} of {total}</span>
        <span>{STEPS[current]}</span>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              i <= current ? 'bg-brand-700' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>}>
      <ScanPageInner />
    </Suspense>
  );
}
