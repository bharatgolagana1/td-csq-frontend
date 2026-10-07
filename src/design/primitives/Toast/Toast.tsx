import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Icon, type IconName } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './Toast.module.css';

export type ToastKind = 'info' | 'success' | 'warn' | 'error';

export type ToastOptions = {
  kind?: ToastKind;
  title: ReactNode;
  description?: ReactNode;
  /** Shown in mono so the user can quote it to support. */
  requestId?: string;
  /** ms; 0 keeps the toast until dismissed. Defaults: 5 s, errors 8 s. */
  duration?: number;
  action?: { label: string; onClick: () => void };
};

type ToastRecord = ToastOptions & { id: number; kind: ToastKind };

type Api = {
  toast: (opts: ToastOptions) => number;
  success: (title: ReactNode, opts?: Omit<ToastOptions, 'title' | 'kind'>) => number;
  error: (title: ReactNode, opts?: Omit<ToastOptions, 'title' | 'kind'>) => number;
  info: (title: ReactNode, opts?: Omit<ToastOptions, 'title' | 'kind'>) => number;
  warn: (title: ReactNode, opts?: Omit<ToastOptions, 'title' | 'kind'>) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<Api | null>(null);

const MAX_VISIBLE = 4;
const ICONS: Record<ToastKind, IconName> = { info: 'info', success: 'check', warn: 'warning', error: 'warning' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = ++seq.current;
      const kind = opts.kind ?? 'info';
      const duration = opts.duration ?? (kind === 'error' ? 8000 : 5000);
      setToasts((list) => [...list, { ...opts, id, kind }].slice(-MAX_VISIBLE));
      if (duration > 0) timers.current.set(id, window.setTimeout(() => dismiss(id), duration));
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => window.clearTimeout(t));
  }, []);

  const api = useMemo<Api>(
    () => ({
      toast,
      success: (title, opts) => toast({ ...opts, title, kind: 'success' }),
      error: (title, opts) => toast({ ...opts, title, kind: 'error' }),
      info: (title, opts) => toast({ ...opts, title, kind: 'info' }),
      warn: (title, opts) => toast({ ...opts, title, kind: 'warn' }),
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            <div className={styles.region} aria-label="Notifications">
              <div aria-live="polite" aria-atomic="false" className={styles.stack}>
                {toasts.filter((t) => t.kind !== 'error').map((t) => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
              </div>
              <div role="alert" aria-live="assertive" className={styles.stack}>
                {toasts.filter((t) => t.kind === 'error').map((t) => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
              </div>
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: number) => void }) {
  return (
    <div className={cn(styles.toast, styles[toast.kind])} data-kind={toast.kind}>
      <span className={styles.icon}>
        <Icon name={ICONS[toast.kind]} size={18} />
      </span>
      <div className={styles.content}>
        <p className={styles.title}>{toast.title}</p>
        {toast.description ? <p className={styles.description}>{toast.description}</p> : null}
        {toast.requestId ? (
          <p className={styles.requestId}>
            Request <code>{toast.requestId}</code>
          </p>
        ) : null}
        {toast.action ? (
          <button
            type="button"
            className={styles.action}
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
          >
            {toast.action.label}
          </button>
        ) : null}
      </div>
      <button type="button" className={styles.close} aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}>
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

export function useToast(): Api {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
