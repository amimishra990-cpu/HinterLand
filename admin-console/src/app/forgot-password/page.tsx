import type { Metadata } from "next";

import { AdminForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset password" };

export default function AdminForgotPasswordPage() {
  return <AdminForgotForm />;
}
