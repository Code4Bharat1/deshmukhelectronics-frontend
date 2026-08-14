'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

let toastRef = null;

export function toast(message, type = 'success', duration = 4000) {
  if (toastRef) {
    toastRef(message, type, duration);
  }
}

const icons = {
  success: <CheckCircle className="w-4 h-4 text-emerald-600" />,
  error: <XCircle className="w-4 h-4 text-red-600" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
  info: <Info className="w-4 h-4 text-blue-600" />,
};

const colors = {
  success: 'border-emerald-200 bg-emerald-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info: 'border-blue-200 bg-blue-50',
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastRef = (message, type, duration) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };
    return () => { toastRef = null; };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 p-3.5 rounded-xl border shadow-lg bg-white animate-slide-up',
            colors[t.type]
          )}
        >
          <div className="shrink-0 mt-0.5">{icons[t.type]}</div>
          <div className="flex-1 text-sm font-medium text-gray-800">{t.message}</div>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="shrink-0 text-gray-400 hover:text-gray-600 min-h-0 p-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
