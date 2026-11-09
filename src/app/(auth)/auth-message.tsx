import { AlertCircle, CheckCircle2 } from "lucide-react";

export function AuthMessage({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const color =
    tone === "error"
      ? "var(--app-terracotta)"
      : tone === "success"
        ? "var(--app-forest)"
        : "var(--app-muted)";
  const background =
    tone === "error"
      ? "var(--app-terracotta-soft)"
      : tone === "success"
        ? "var(--app-forest-soft)"
        : "var(--app-panel-soft)";

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="flex items-start gap-2 rounded-md border px-3 py-2.5 text-[12px] leading-5"
      style={{
        color,
        backgroundColor: background,
        borderColor: tone === "error" ? "rgba(163,90,60,.32)" : "var(--app-line)",
      }}
    >
      {tone === "error" ? (
        <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      ) : tone === "success" ? (
        <CheckCircle2 size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </div>
  );
}
