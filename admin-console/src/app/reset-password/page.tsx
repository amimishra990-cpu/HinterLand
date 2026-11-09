import type { Metadata } from "next";

import { AdminResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function AdminResetPasswordPage() {
  return <AdminResetForm />;
}
