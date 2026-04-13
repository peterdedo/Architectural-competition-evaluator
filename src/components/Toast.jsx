import React from 'react';

const Toast = ({ toasts, onHide }) => {
  if (!toasts || toasts.length === 0) return null;

  const typeClass = (type) => {
    switch (type) {
      case 'error':
        return 'border-red-300 bg-red-50 text-red-900';
      case 'success':
        return 'border-emerald-300 bg-emerald-50 text-emerald-900';
      case 'info':
      default:
        return 'border-slate-200 bg-white text-slate-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`rounded-xl shadow-lg border p-4 min-w-80 max-w-md cursor-pointer hover:shadow-xl transition-all duration-200 ${typeClass(toast.type)}`}
          onClick={() => onHide && onHide(toast.id)}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg" aria-hidden>
              {toast.type === 'error' ? '⚠️' : toast.type === 'success' ? '✓' : 'ℹ️'}
            </span>
            <span className="font-semibold flex-1">{toast.message}</span>
            <button
              type="button"
              className="ml-auto text-slate-500 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded px-1"
              aria-label="Zavřít upozornění"
              onClick={(e) => {
                e.stopPropagation();
                onHide && onHide(toast.id);
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toast;