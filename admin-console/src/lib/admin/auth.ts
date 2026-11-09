import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  full_name: string;
  username: string | null;
  bio: string | null;
  is_admin: boolean;
  must_change_password: boolean;
  last_seen_at: string | null;
};

type AdminSession = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string } | null;
  profile: AdminProfile | null;
};

export const loadAdminSession = cache(async (): Promise<AdminSession> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, bio, is_admin, must_change_password, last_seen_at")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile: (profile as AdminProfile | null) ?? null,
  };
});

export async function requireAdminSession(options?: {
  allowPasswordChange?: boolean;
}): Promise<AdminSession & { user: { id: string; email?: string }; profile: AdminProfile }> {
  const session = await loadAdminSession();

  if (!session.user) {
    redirect("/login?next=/admin");
  }

  if (!session.profile?.is_admin) {
    notFound();
  }

  if (session.profile.must_change_password && !options?.allowPasswordChange) {
    redirect("/admin/set-password");
  }

  return {
    ...session,
    user: session.user,
    profile: session.profile,
  };
}

type AdminApiContext =
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      user: { id: string; email?: string };
      profile: AdminProfile;
    }
  | { ok: false; response: NextResponse };

export async function requireAdminApi(): Promise<AdminApiContext> {
  const session = await loadAdminSession();

  if (!session.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }

  if (!session.profile?.is_admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Administrator access required." }, { status: 403 }),
    };
  }

  if (session.profile.must_change_password) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "A password change is required before using the admin console." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    supabase: session.supabase,
    user: session.user,
    profile: session.profile,
  };
}
