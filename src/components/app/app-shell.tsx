"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  X,
} from "lucide-react";

import { APP_NAV, findNavItem } from "@/components/app/nav-config";
import { SearchDialog } from "@/components/app/search-dialog";
import { ToastProvider } from "@/components/app/toast";
import { Avatar, Badge } from "@/components/app/ui";
import { useWorkspace } from "@/components/app/workspace-provider";
import { signOutAction } from "@/app/(auth)/actions";

function SidebarContent({
  collapsed,
  pathname,
  onNavigate,
  onToggleCollapse,
  mobile = false,
}: {
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  mobile?: boolean;
}) {
  const { profile: account } = useWorkspace();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={
          collapsed && !mobile
            ? "flex flex-col items-center gap-1.5 px-3 py-3"
            : "flex items-center justify-between gap-2 px-3 py-4"
        }
        style={{ borderBottom: "1px solid var(--app-line)" }}
      >
        <Link
          href="/app"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2.5"
          aria-label="Hinterland workspace"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center border font-heading text-[15px]"
            style={{
              borderColor: "var(--app-forest)",
              color: "var(--app-forest)",
              borderRadius: 3,
            }}
            aria-hidden="true"
          >
            H
          </span>
          {!collapsed || mobile ? (
            <span className="min-w-0">
              <span className="block truncate font-heading text-[15px] tracking-[0.12em]">
                HINTERLAND
              </span>
              <span
                className="block text-[10px] tracking-[0.16em] uppercase"
                style={{ color: "var(--app-muted)" }}
              >
                Workspace
              </span>
            </span>
          ) : null}
        </Link>

        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="app-icon-btn hidden shrink-0 md:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={16} aria-hidden="true" />
            )}
          </button>
        ) : null}

        {mobile ? (
          <button
            type="button"
            onClick={onNavigate}
            className="app-icon-btn shrink-0"
            aria-label="Close navigation"
          >
            <X size={17} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav className="app-scroll flex-1 overflow-y-auto px-2 py-3" aria-label="Workspace">
        {APP_NAV.map((group) => (
          <div key={group.group} className="mb-4 last:mb-0">
            {!collapsed || mobile ? (
              <p
                className="px-2.5 pb-1.5 text-[9.5px] font-semibold tracking-[0.16em] uppercase"
                style={{ color: "var(--app-muted)" }}
              >
                {group.group}
              </p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6" style={{ backgroundColor: "var(--app-line)" }} />
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/app"
                    ? pathname === "/app"
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      data-active={active}
                      data-collapsed={collapsed && !mobile}
                      className="app-nav-item"
                      title={collapsed && !mobile ? item.label : undefined}
                    >
                      <Icon size={16} className="app-nav-icon shrink-0" aria-hidden="true" />
                      {!collapsed || mobile ? (
                        <span className="truncate">{item.label}</span>
                      ) : (
                        <span className="sr-only">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-2 pb-2" style={{ borderTop: "1px solid var(--app-line)" }}>
        <ul className="mt-2 space-y-0.5">
          <li>
            <Link
              href="/app/settings"
              onClick={onNavigate}
              data-collapsed={collapsed && !mobile}
              className="app-nav-item"
              title={collapsed && !mobile ? "Settings" : undefined}
            >
              <Settings size={16} className="shrink-0" aria-hidden="true" />
              {!collapsed || mobile ? <span>Settings</span> : <span className="sr-only">Settings</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/app/help"
              onClick={onNavigate}
              data-collapsed={collapsed && !mobile}
              className="app-nav-item"
              title={collapsed && !mobile ? "Help" : undefined}
            >
              <CircleHelp size={16} className="shrink-0" aria-hidden="true" />
              {!collapsed || mobile ? <span>Help</span> : <span className="sr-only">Help</span>}
            </Link>
          </li>
        </ul>
      </div>

      {!collapsed || mobile ? (
        <div className="px-3 pb-4">
          <div
            className="rounded-lg border px-3 py-2.5"
            style={{
              borderColor: "var(--app-line)",
              backgroundColor: "var(--app-panel-soft)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="app-eyebrow" style={{ color: "var(--app-forest)" }}>
                Account
              </span>
              <Badge tone={account.emailVerified ? "forest" : "gold"}>
                {account.emailVerified ? "Verified" : "Verify email"}
              </Badge>
            </div>
            <p className="mt-1.5 truncate text-[11px] leading-4" style={{ color: "var(--app-muted)" }}>
              {account.email}
            </p>
            <p className="mt-1 text-[10.5px] leading-4" style={{ color: "var(--app-muted)" }}>
              Data saved to your private workspace.
            </p>
          </div>
          <Link
            href="/"
            onClick={onNavigate}
            className="mt-2 flex items-center justify-between rounded-md px-2.5 py-2 text-[11.5px]"
            style={{ color: "var(--app-muted)" }}
          >
            Back to hinterland.com
            <ChevronRight size={13} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, data } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Record<string, boolean>>({});

  const notifications = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      detail: string;
      time: string;
      href: string;
    }> = [];
    const openActions = data.actions.filter((action) => !action.done);
    if (openActions.length > 0) {
      items.push({
        id: "open-actions",
        title: `${openActions.length} open action ${openActions.length === 1 ? "item" : "items"}`,
        detail: "Review the commitments that still need attention.",
        time: "Your workspace",
        href: "/app#actions",
      });
    }
    const pendingRecords = data.knowledge.filter((record) => !record.approved);
    if (pendingRecords.length > 0) {
      items.push({
        id: "pending-records",
        title: `${pendingRecords.length} record${pendingRecords.length === 1 ? "" : "s"} awaiting approval`,
        detail: "Approval is required before a record is treated as confirmed.",
        time: "Knowledge repository",
        href: "/app/knowledge",
      });
    }
    if (data.documents.length > 0) {
      items.push({
        id: "documents",
        title: `${data.documents.length} document${data.documents.length === 1 ? "" : "s"} in your library`,
        detail: "Sources stay private to your account.",
        time: "Document library",
        href: "/app/projects?tab=documents",
      });
    }
    if (items.length === 0) {
      items.push({
        id: "start",
        title: "Start with a project",
        detail: "Create a project or upload a document to build your context.",
        time: "Getting started",
        href: "/app/projects",
      });
    }
    return items.map((item) => ({ ...item, unread: !readNotifications[item.id] }));
  }, [data, readNotifications]);

  const current = findNavItem(pathname);
  const unread = notifications.filter((item) => item.unread).length;

  const markAllRead = () => {
    setReadNotifications(
      Object.fromEntries(notifications.map((item) => [item.id, true]))
    );
  };

  const markRead = (id: string) => {
    setReadNotifications((current) => ({ ...current, [id]: true }));
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- route changes must close transient menus */
    setMobileOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ToastProvider>
      <div className="app-theme flex min-h-dvh" data-app="true">
        <aside
          className="sticky top-0 hidden h-dvh shrink-0 transition-[width] duration-200 md:flex"
          style={{
            width: collapsed ? 72 : 256,
            backgroundColor: "var(--app-panel)",
            borderRight: "1px solid var(--app-line)",
          }}
        >
          <div className="w-full">
            <SidebarContent
              collapsed={collapsed}
              pathname={pathname}
              onToggleCollapse={() => setCollapsed((value) => !value)}
            />
          </div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-[70] md:hidden">
            <button
              type="button"
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(20,30,24,.42)" }}
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation overlay"
            />
            <div
              className="relative h-dvh w-[282px] max-w-[86vw] shadow-2xl"
              style={{
                backgroundColor: "var(--app-panel)",
                borderRight: "1px solid var(--app-line)",
              }}
            >
              <SidebarContent
                collapsed={false}
                pathname={pathname}
                mobile
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="sticky top-0 z-40"
            style={{
              backgroundColor: "rgba(255, 252, 244, 0.94)",
              borderBottom: "1px solid var(--app-line)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-5">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="app-icon-btn md:hidden"
                aria-label="Open navigation"
              >
                <Menu size={18} aria-hidden="true" />
              </button>

              <div className="hidden min-w-0 items-center gap-2 sm:flex">
                <span className="text-[12px]" style={{ color: "var(--app-muted)" }}>
                  Workspace
                </span>
                <ChevronRight size={12} aria-hidden="true" style={{ color: "var(--app-muted)" }} />
                <span className="truncate text-[12.5px] font-medium">
                  {current?.short ??
                    (pathname.startsWith("/app/settings")
                      ? "Settings"
                      : pathname.startsWith("/app/help")
                        ? "Help"
                        : "Overview")}
                </span>
              </div>

              <div className="flex flex-1 items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="hidden h-9 w-[230px] items-center gap-2 rounded-lg border px-3 text-left text-[12.5px] transition-colors hover:bg-black/[0.03] lg:flex"
                  style={{
                    borderColor: "var(--app-line-strong)",
                    backgroundColor: "var(--app-panel-soft)",
                    color: "var(--app-muted)",
                  }}
                >
                  <Search size={14} aria-hidden="true" />
                  <span className="flex-1">Search workspace</span>
                  <span className="app-kbd">Ctrl K</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="app-icon-btn lg:hidden"
                  aria-label="Search workspace"
                >
                  <Search size={17} aria-hidden="true" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen((value) => !value);
                      setProfileOpen(false);
                    }}
                    className="app-icon-btn relative"
                    aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                    aria-expanded={notificationsOpen}
                  >
                    <Bell size={17} aria-hidden="true" />
                    {unread > 0 ? (
                      <span
                        className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold"
                        style={{ backgroundColor: "var(--app-terracotta)", color: "#fff8f2" }}
                      >
                        {unread}
                      </span>
                    ) : null}
                  </button>

                  {notificationsOpen ? (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setNotificationsOpen(false)}
                        aria-label="Close notifications"
                        tabIndex={-1}
                      />
                      <div
                        className="app-card absolute right-0 z-50 mt-2 w-[310px] overflow-hidden"
                        role="dialog"
                        aria-label="Notifications"
                      >
                        <div
                          className="flex items-center justify-between border-b px-3.5 py-2.5"
                          style={{ borderColor: "var(--app-line)" }}
                        >
                          <p className="text-[12px] font-semibold">Notifications</p>
                          <button
                            type="button"
                            className="text-[11px]"
                            style={{ color: "var(--app-forest)" }}
                            onClick={markAllRead}
                          >
                            Mark all read
                          </button>
                        </div>
                        <ul className="max-h-[320px] overflow-y-auto">
                          {notifications.map((item) => (
                            <li
                              key={item.id}
                              className="border-b last:border-b-0"
                              style={{ borderColor: "var(--app-line)" }}
                            >
                              <Link
                                href={item.href}
                                onClick={() => {
                                  markRead(item.id);
                                  setNotificationsOpen(false);
                                }}
                                className="block w-full px-3.5 py-3 text-left hover:bg-black/[0.02]"
                              >
                                <span className="flex items-start gap-2">
                                  <span
                                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: item.unread
                                        ? "var(--app-terracotta)"
                                        : "transparent",
                                    }}
                                  />
                                  <span className="min-w-0">
                                    <span className="block text-[12.5px] font-medium">
                                      {item.title}
                                    </span>
                                    <span
                                      className="mt-0.5 block text-[11.5px] leading-4"
                                      style={{ color: "var(--app-muted)" }}
                                    >
                                      {item.detail}
                                    </span>
                                    <span
                                      className="mt-1 block text-[10.5px]"
                                      style={{ color: "var(--app-muted)" }}
                                    >
                                      {item.time}
                                    </span>
                                  </span>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <Link
                          href="/app#actions"
                          onClick={() => setNotificationsOpen(false)}
                          className="block border-t px-3.5 py-2.5 text-center text-[11.5px] font-medium"
                          style={{
                            borderColor: "var(--app-line)",
                            color: "var(--app-forest)",
                          }}
                        >
                          View pending actions
                        </Link>
                      </div>
                    </>
                  ) : null}
                </div>

                <Link
                  href="/app/help"
                  className="app-icon-btn hidden sm:inline-flex"
                  aria-label="Help"
                >
                  <CircleHelp size={17} aria-hidden="true" />
                </Link>
                <Link
                  href="/app/settings"
                  className="app-icon-btn hidden sm:inline-flex"
                  aria-label="Settings"
                >
                  <Settings size={17} aria-hidden="true" />
                </Link>

                <div className="relative ml-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen((value) => !value);
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 transition-colors hover:bg-black/[0.04]"
                    aria-label="Open profile menu"
                    aria-expanded={profileOpen}
                  >
                    <Avatar name={profile.fullName} />
                    <span className="hidden text-left xl:block">
                      <span className="block text-[12px] leading-4 font-medium">
                        {profile.fullName}
                      </span>
                      <span
                        className="block text-[10px] leading-3"
                        style={{ color: "var(--app-muted)" }}
                      >
                        {profile.role}
                      </span>
                    </span>
                  </button>

                  {profileOpen ? (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setProfileOpen(false)}
                        aria-label="Close profile menu"
                        tabIndex={-1}
                      />
                      <div
                        className="app-card absolute right-0 z-50 mt-2 w-[248px] overflow-hidden"
                        role="dialog"
                        aria-label="Profile"
                      >
                        <div
                          className="flex items-center gap-2.5 border-b px-3.5 py-3"
                          style={{ borderColor: "var(--app-line)" }}
                        >
                          <Avatar name={profile.fullName} size={34} />
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-medium">{profile.fullName}</p>
                            <p
                              className="truncate text-[11px]"
                              style={{ color: "var(--app-muted)" }}
                            >
                              {profile.email}
                            </p>
                          </div>
                        </div>
                        <div className="p-1.5">
                          <Link
                            href="/app/settings"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[12.5px] hover:bg-black/[0.03]"
                          >
                            <Settings size={14} aria-hidden="true" />
                            Settings
                          </Link>
                          <Link
                            href="/app/help"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[12.5px] hover:bg-black/[0.03]"
                          >
                            <CircleHelp size={14} aria-hidden="true" />
                            Help and shortcuts
                          </Link>
                          <div className="my-1 h-px" style={{ backgroundColor: "var(--app-line)" }} />
                          <form action={signOutAction}>
                            <button
                              type="submit"
                              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12.5px] hover:bg-black/[0.03]"
                            >
                              <LogOut size={14} aria-hidden="true" />
                              Sign out
                            </button>
                          </form>
                        </div>
                        <div
                          className="border-t px-3.5 py-2"
                          style={{ borderColor: "var(--app-line)" }}
                        >
                          <p className="text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                            {profile.emailVerified
                              ? "Email verified · Private workspace session"
                              : "Confirm your email to secure your account."}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

          </header>

          <main id="main" className="flex-1">
            <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>

        {searchOpen ? (
          <SearchDialog open onClose={() => setSearchOpen(false)} />
        ) : null}
      </div>
    </ToastProvider>
  );
}
