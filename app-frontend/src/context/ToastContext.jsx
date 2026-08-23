import { createContext, useContext, useState, useCallback } from 'react';
import { colors, radius, shadow } from '../theme';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={styles.container}>
        {toasts.map((t) => (
          <div key={t.id} style={{ ...styles.toast, ...typeStyles(t.type) }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function typeStyles(type) {
  if (type === 'error') return { borderColor: colors.danger, color: colors.danger };
  if (type === 'success') return { borderColor: colors.success, color: colors.success };
  return { borderColor: colors.border, color: colors.text };
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 100,
    alignItems: 'center',
    width: '100%',
    padding: '0 16px',
  },
  toast: {
    background: colors.surface2,
    border: '1px solid',
    borderRadius: radius.md,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 500,
    boxShadow: shadow.md,
    maxWidth: 380,
    textAlign: 'center',
    animation: 'fadeIn 0.2s ease',
  },
};
