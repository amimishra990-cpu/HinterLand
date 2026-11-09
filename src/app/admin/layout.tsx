import type { Metadata } from "next";

import "./admin.css";

export const metadata: Metadata = {
  title: {
    default: "Admin Console",
    template: "%s · Hinterland Admin",
  },
  description: "Restricted Hinterland administration console.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
