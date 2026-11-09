"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  Database,
  Gauge,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/login-activity", label: "Login Activity", icon: Activity },
  { href: "/admin/issues", label: "Website Issues", icon: AlertTriangle },
  { href: "/admin/health", label: "System Health", icon: Gauge },
  { href: "/admin/database", label: "Database Activity", icon: Database },
  { href: "/admin/audit", label: "Audit Logs", icon: ListChecks },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 px-2 py-3" aria-label="Admin console">
      <p className="px-2.5 pb-2 text-[9px] font-semibold tracking-[0.18em] uppercase text-[rgba(239,234,222,0.42)]">
        Operations
      </p>
      <ul className="space-y-0.5">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="admin-nav-item"
                data-active={active}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={15} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="my-3 h-px bg-[rgba(239,234,222,0.12)]" />
      <Link
        href="/app"
        onClick={onNavigate}
        className="admin-nav-item"
      >
        <ArrowLeftRight size={15} aria-hidden="true" className="shrink-0" />
        <span className="truncate">User workspace</span>
      </Link>
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5" aria-label="HINTERLAND admin console">
      <span
        className="flex h-8 w-8 items-center justify-center border font-heading text-[15px]"
        style={{ borderColor: "rgba(201,173,117,0.55)", color: "#c9ad75", borderRadius: 3 }}
        aria-hidden="true"
      >
        H
      </span>
      <span>
        <span className="block font-heading text-[15px] tracking-[0.12em] text-[#f5f2e9]">
          HINTERLAND
        </span>
        <span className="block text-[9.5px] tracking-[0.18em] uppercase text-[#c9ad75]">
          Admin Console
        </span>
      </span>
    </Link>
  );
}

export function AdminShell({
  children,
  actorName,
  actorEmail,
}: {
  children: ReactNode;
  actorName: string;
  actorEmail: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- route changes close the mobile drawer */
    setMobileOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname]);

  return (
    <div className="admin-theme flex min-h-dvh">
      <aside className="admin-sidebar sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col lg:flex">
        <div className="px-3.5 py-4">
          <Brand />
        </div>
        <div className="mx-3.5 h-px bg-[rgba(239,234,222,0.12)]" />
        <NavList pathname={pathname} />
        <div className="border-t border-[rgba(239,234,222,0.12)] px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-[#c9ad75]">
            <ShieldCheck size={12} aria-hidden="true" />
            Restricted access
          </p>
          <p className="mt-1 truncate text-[11.5px] text-[rgba(239,234,222,0.78)]">{actorName}</p>
          <p className="truncate text-[10.5px] text-[rgba(239,234,222,0.5)]">{actorEmail}</p>
          <form action={signOutAction} className="mt-2.5">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded border border-[rgba(239,234,222,0.18)] px-2 py-1.5 text-[11.5px] text-[rgba(239,234,222,0.82)] transition-colors hover:bg-[rgba(239,234,222,0.08)]"
            >
              <LogOut size={13} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation overlay"
          />
          <div className="admin-sidebar relative flex h-dvh w-[268px] max-w-[84vw] flex-col shadow-2xl">
            <div className="flex items-center justify-between px-3.5 py-4">
              <Brand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded p-1.5 text-[#efeade]"
                aria-label="Close navigation"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            <div className="mx-3.5 h-px bg-[rgba(239,234,222,0.12)]" />
            <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-[rgba(239,234,222,0.12)] px-3.5 py-3">
              <p className="truncate text-[11.5px] text-[rgba(239,234,222,0.78)]">{actorName}</p>
              <p className="truncate text-[10.5px] text-[rgba(239,234,222,0.5)]">{actorEmail}</p>
              <form action={signOutAction} className="mt-2.5">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 rounded border border-[rgba(239,234,222,0.18)] px-2 py-1.5 text-[11.5px] text-[rgba(239,234,222,0.82)]"
                >
                  <LogOut size={13} aria-hidden="true" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--adm-line)] bg-[rgba(251,248,240,0.94)] backdrop-blur-sm">
          <div className="flex h-12 items-center gap-2 px-3 sm:px-5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded p-1.5 text-[var(--adm-ink-soft)] hover:bg-[var(--adm-panel-strong)] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <span className="admin-eyebrow">Hinterland</span>
            <span className="text-[11px] text-[var(--adm-line-strong)]">/</span>
            <span className="text-[11.5px] font-medium text-[var(--adm-ink-soft)]">
              Administration
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[10.5px] text-[var(--adm-muted)]">
              <ShieldCheck size={12} aria-hidden="true" />
              Server-verified administrator
            </span>
          </div>
        </header>
        <main id="main" className="flex-1">
          <div className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
