'use client';
import { useState } from 'react';
import { QrCode, Download, Printer } from 'lucide-react';
import { productsApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';

export default function QRCodesPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll({ limit: 100 });
      setProducts(res.data.data || []);
      setFetched(true);
    } catch { toast('Failed to load products', 'error'); }
    setLoading(false);
  };

  const handleRegenerate = async (id, name) => {
    try {
      await productsApi.generateQR(id);
      toast(`QR regenerated for ${name}`, 'success');
      fetchProducts();
    } catch { toast('Failed to regenerate QR', 'error'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">QR Codes</h1><p className="text-gray-500 text-sm">Scan-ready codes for all products</p></div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4"/> Print All
          </button>
          {!fetched && (
            <button className="btn-primary" onClick={fetchProducts} disabled={loading}>
              {loading ? 'Loading...' : 'Load QR Codes'}
            </button>
          )}
        </div>
      </div>

      {!fetched ? (
        <div className="empty-state py-16">
          <div className="empty-icon"><QrCode className="w-8 h-8 text-gray-300"/></div>
          <h3 className="text-gray-500 font-semibold">Ready to load QR codes</h3>
          <p className="text-gray-400 text-sm">Click "Load QR Codes" to display all product QR codes</p>
          <button className="btn-primary mt-2" onClick={fetchProducts}>Load QR Codes</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 print-grid">
          {products.map((p) => (
            <div key={p._id} className="card flex flex-col items-center gap-3 text-center print-card">
              {p.qrCodeImage ? (
                <img src={p.qrCodeImage} alt={`QR for ${p.name}`} className="w-32 h-32" />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-gray-300"/>
                </div>
              )}
              <div className="w-full">
                <div className="font-semibold text-xs text-gray-900 leading-tight">{p.name}</div>
                <div className="font-mono text-[10px] text-gray-400 mt-0.5">{p.sku}</div>
              </div>
              <button
                className="btn-ghost btn-sm text-xs text-brand-700 min-h-0 py-1 px-2"
                onClick={() => handleRegenerate(p._id, p.name)}
              >↻ Regen</button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media print {
          .print-grid { grid-template-columns: repeat(5, 1fr); }
          .print-card { page-break-inside: avoid; box-shadow: none; border: 1px solid #e5e7eb; }
          header, nav, .bottom-nav, button { display: none !important; }
        }
      `}</style>
    </div>
  );
}
