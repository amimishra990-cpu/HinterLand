import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Verify your email" };

export default function VerifyEmailPage() {
  return (
    <div>
      <p className="app-eyebrow">Account</p>
      <h1 className="mt-2 font-heading text-[32px] leading-tight">Check your email</h1>
      <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--app-muted)" }}>
        Open the verification link sent to your address. It returns you to Hinterland and
        signs you in. If it has expired, sign in to request another link.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/login" className="app-btn app-btn-primary">
          Go to sign in
        </Link>
        <Link href="/register" className="app-btn app-btn-secondary">
          Use another email
        </Link>
      </div>
    </div>
  );
}
