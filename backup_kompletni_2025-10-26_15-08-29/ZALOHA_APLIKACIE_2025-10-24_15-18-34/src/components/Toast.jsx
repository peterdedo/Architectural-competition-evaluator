import React from 'react';

const Toast = ({ toasts, onHide }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 min-w-80 max-w-md cursor-pointer hover:shadow-xl transition-all duration-200"
          onClick={() => onHide && onHide(toast.id)}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">ℹ️</span>
            <span className="font-semibold text-slate-800">{toast.message}</span>
            <button
              className="ml-auto text-slate-400 hover:text-slate-600"
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