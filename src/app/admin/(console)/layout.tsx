import { requireAdminSession } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const instant = false;

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireAdminSession();

  return (
    <AdminShell
      actorName={profile.full_name || profile.username || "Administrator"}
      actorEmail={user.email ?? profile.username ?? "admin"}
    >
      {children}
    </AdminShell>
  );
}
