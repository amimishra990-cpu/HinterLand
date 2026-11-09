"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Check, Copy, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/components/app/toast";

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold";

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: "md" | "sm" = "md",
  className?: string
) {
  return cn(
    "app-btn",
    `app-btn-${variant}`,
    size === "sm" && "app-btn-sm",
    className
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "md" | "sm";
}) {
  return (
    <button className={buttonClass(variant, size, className)} {...props} />
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between"
      style={{ borderColor: "var(--app-line)" }}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="app-eyebrow">{eyebrow}</p>
        </div>
        <h1 className="mt-2 font-heading text-[28px] leading-tight tracking-[-0.015em] sm:text-[34px]">
          {title}
        </h1>
        <p
          className="mt-2 max-w-[62ch] text-[13.5px] leading-6"
          style={{ color: "var(--app-muted)" }}
        >
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function Card({
  children,
  className,
  soft = false,
  id,
}: {
  children: ReactNode;
  className?: string;
  soft?: boolean;
  id?: string;
}) {
  return (
    <div id={id} className={cn(soft ? "app-card-soft" : "app-card", className)}>
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  action,
  description,
}: {
  title: string;
  action?: ReactNode;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="font-heading text-[19px] leading-snug">{title}</h2>
        {description ? (
          <p
            className="mt-1 text-[12.5px] leading-5"
            style={{ color: "var(--app-muted)" }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type BadgeTone = "neutral" | "forest" | "gold" | "terracotta" | "navy" | "burgundy";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return <span className={`app-badge app-badge-${tone}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone: BadgeTone =
    status === "Active" || status === "Ready" || status === "Approved"
      ? "forest"
      : status === "In review" ||
          status === "Processing" ||
          status === "Needs review"
        ? "gold"
        : status === "Paused" || status === "Open" || status === "Failed"
          ? "terracotta"
          : "neutral";

  return <Badge tone={tone}>{status}</Badge>;
}

export function Field({
  label,
  hint,
  htmlFor,
  required,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="app-label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span style={{ color: "var(--app-terracotta)" }}> *</span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p
          className="mt-1.5 text-[11.5px] leading-4"
          style={{ color: "var(--app-muted)" }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} {...props} className={cn("app-input", className)} />;
});

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("app-textarea", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("app-select", props.className)} />;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: Array<{ value: string; label: string; count?: number }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-6 overflow-x-auto", className)}
      style={{ borderBottom: "1px solid var(--app-line)" }}
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          data-active={value === item.value}
          onClick={() => onChange(item.value)}
          className="app-tab shrink-0"
        >
          {item.label}
          {typeof item.count === "number" ? (
            <span className="ml-1.5 text-[11px]" style={{ color: "var(--app-muted)" }}>
              {item.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(20, 30, 24, 0.42)" }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "app-dialog relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-xl sm:rounded-xl",
          size === "sm" && "sm:max-w-[440px]",
          size === "md" && "sm:max-w-[620px]",
          size === "lg" && "sm:max-w-[860px]"
        )}
        style={{
          backgroundColor: "var(--app-panel)",
          border: "1px solid var(--app-line)",
          boxShadow: "0 30px 80px -30px rgba(20,30,24,.55)",
        }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: "var(--app-line)" }}
        >
          <div>
            <h2 id={titleId} className="font-heading text-[20px] leading-snug">
              {title}
            </h2>
            {description ? (
              <p
                className="mt-1 text-[12.5px] leading-5"
                style={{ color: "var(--app-muted)" }}
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="app-icon-btn shrink-0"
            aria-label="Close dialog"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
        <div className="app-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div
            className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3.5"
            style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel-soft)" }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icon ? (
        <div
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--app-panel-strong)", color: "var(--app-muted)" }}
        >
          {icon}
        </div>
      ) : null}
      <p className="font-heading text-[17px]">{title}</p>
      <p
        className="mt-1.5 max-w-[44ch] text-[12.5px] leading-5"
        style={{ color: "var(--app-muted)" }}
      >
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px]" style={{ color: "var(--app-muted)" }}>
      <span className="app-spinner" aria-hidden="true" />
      {label ? <span role="status">{label}</span> : null}
    </span>
  );
}

export function CopyButton({
  value,
  label = "Copy",
  success = "Copied to clipboard.",
  size = "sm",
  variant = "secondary",
}: {
  value: string;
  label?: string;
  success?: string;
  size?: "md" | "sm";
  variant?: ButtonVariant;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }

    setCopied(true);
    toast(success, "success");
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button type="button" variant={variant} size={size} onClick={copy}>
      {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: "var(--app-forest)",
        color: "#f5f1e6",
        fontSize: size * 0.34,
        letterSpacing: "0.02em",
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
