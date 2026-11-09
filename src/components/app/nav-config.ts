import {
  BookOpen,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  NotebookPen,
  PenLine,
  Sprout,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  short: string;
};

export const APP_NAV: Array<{ group: string; items: NavItem[] }> = [
  {
    group: "Workspace",
    items: [
      {
        label: "Overview",
        href: "/app",
        icon: LayoutDashboard,
        short: "Overview",
      },
    ],
  },
  {
    group: "Work",
    items: [
      {
        label: "Communication",
        href: "/app/communication",
        icon: PenLine,
        short: "Communication",
      },
      {
        label: "Meeting Preparation",
        href: "/app/preparation",
        icon: ClipboardList,
        short: "Preparation",
      },
      {
        label: "Meeting Intelligence",
        href: "/app/intelligence",
        icon: NotebookPen,
        short: "Intelligence",
      },
    ],
  },
  {
    group: "Context",
    items: [
      {
        label: "Projects & Documents",
        href: "/app/projects",
        icon: FolderOpen,
        short: "Projects",
      },
      {
        label: "Knowledge Repository",
        href: "/app/knowledge",
        icon: BookOpen,
        short: "Knowledge",
      },
    ],
  },
  {
    group: "Growth",
    items: [
      {
        label: "My Development",
        href: "/app/development",
        icon: Sprout,
        short: "Development",
      },
    ],
  },
];

export const APP_NAV_FLAT = APP_NAV.flatMap((group) => group.items);

export function findNavItem(pathname: string) {
  if (pathname === "/app") return APP_NAV_FLAT[0];
  return APP_NAV_FLAT.find(
    (item) => item.href !== "/app" && pathname.startsWith(item.href)
  );
}
