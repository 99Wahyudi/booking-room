import React, { createContext, useContext, useCallback, useState } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success', duration = 4000) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), duration);
      return id;
    },
    [removeToast]
  );

  const success = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg) => showToast(msg, 'error', 6000), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error }}>
      {children}
      {/* Container toast - fixed di kanan atas */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg border ${
              toast.type === 'error'
                ? 'bg-error-container border-outline-variant/40 text-on-error-container'
                : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface'
            }`}
          >
            <span
              className={`material-symbols-outlined text-xl ${
                toast.type === 'error' ? 'text-error' : 'text-primary'
              }`}
            >
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Tutup notifikasi"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast harus dipakai di dalam <ToastProvider>');
  }
  return ctx;
}