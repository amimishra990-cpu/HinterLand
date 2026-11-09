"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastTone = "default" | "success" | "info" | "error";
type ToastItem = { id: number; message: string; tone: ToastTone };
type ToastFn = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback<ToastFn>(
    (message, tone = "default") => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-4 bottom-4 z-[90] flex w-[min(92vw,340px)] flex-col gap-2"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className="app-toast pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-3 shadow-lg"
            style={{
              backgroundColor: "var(--app-panel)",
              borderColor:
                item.tone === "success"
                  ? "rgba(48,78,62,.35)"
                  : item.tone === "error"
                    ? "rgba(163,90,60,.45)"
                    : "var(--app-line)",
              color: "var(--app-ink)",
            }}
          >
            {item.tone === "success" ? (
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--app-forest)" }}
                aria-hidden="true"
              />
            ) : item.tone === "error" ? (
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--app-terracotta)" }}
                aria-hidden="true"
              />
            ) : (
              <Info
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--app-gold)" }}
                aria-hidden="true"
              />
            )}
            <p className="flex-1 text-[12.5px] leading-5">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="shrink-0 rounded p-0.5 hover:bg-black/5"
              aria-label="Dismiss notification"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
