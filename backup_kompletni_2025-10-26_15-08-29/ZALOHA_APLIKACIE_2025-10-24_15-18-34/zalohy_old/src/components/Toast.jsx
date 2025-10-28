import React from 'react';
import { createPortal } from 'react-dom';

const Toast = ({ toasts, onHide }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getToastClass = (type) => {
    const baseClass = 'toast';
    switch (type) {
      case 'success': return `${baseClass} toast-success`;
      case 'error': return `${baseClass} toast-error`;
      case 'warning': return `${baseClass} toast-warning`;
      default: return `${baseClass} toast-info`;
    }
  };

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={getToastClass(toast.type)}
          onClick={() => onHide(toast.id)}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{getIcon(toast.type)}</span>
            <span className="font-semibold text-slate-800">{toast.message}</span>
            <button
              className="ml-auto text-slate-400 hover:text-slate-600"
              onClick={(e) => {
                e.stopPropagation();
                onHide(toast.id);
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
};

export default Toast;







