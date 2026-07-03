import { createContext, useContext, useState, useRef, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; msg: string; type: ToastType; }
interface ToastCtx { toast: (msg: string, type?: ToastType) => void; }

const Ctx = createContext<ToastCtx>({ toast: () => {} });

const COLORS: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: '#e8f5e9', border: '#a5d6a7', color: '#1b5e20' },
  error:   { bg: '#fdecea', border: '#ef9a9a', color: '#b71c1c' },
  info:    { bg: '#e3f2fd', border: '#90caf9', color: '#0d47a1' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  function dismiss(id: number) {
    setToasts(t => t.filter(x => x.id !== id));
  }

  function toast(msg: string, type: ToastType = 'info') {
    const id = nextId.current++;
    setToasts(t => [...t, { id, msg, type }]);
    // Errors stay longer — users need time to read what went wrong
    setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3000);
  }

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(({ id, msg, type }) => {
          const c = COLORS[type];
          return (
            <div key={id} style={{
              background: c.bg, border: `1px solid ${c.border}`, color: c.color,
              padding: '10px 12px 10px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0,0,0,.15)', minWidth: 240, maxWidth: 360,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ flex: 1 }}>{msg}</span>
              <button
                onClick={() => dismiss(id)}
                aria-label="Dismiss"
                style={{
                  border: 0, background: 'transparent', color: 'inherit', opacity: 0.6,
                  fontSize: 15, lineHeight: 1, padding: 0, cursor: 'pointer', flexShrink: 0,
                }}>
                ×
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
