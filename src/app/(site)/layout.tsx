import type { ReactNode } from "react";

import { AmbientField } from "@/components/layout/ambient-field";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <AmbientField />
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
