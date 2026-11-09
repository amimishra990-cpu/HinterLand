"use client";

import { useEffect } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

// Supabase email links fall back to the bare Site URL when /auth/callback is not
// on the project's redirect allow list. Those links carry the session in the URL
// fragment (?code=... or #access_token=...) and never reach the server, so the
// session has to be established in the browser before the app can see it.
export function SessionBridge() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    if (pathname === "/auth/callback") return;

    const query = new URLSearchParams(search);
    const errorCode = query.get("error_code");
    if (errorCode || query.get("error")) {
      window.location.replace("/login?error=link-invalid");
      return;
    }

    const code = query.get("code");
    const fragment = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    const type = fragment.get("type");

    if (!code && !(accessToken && refreshToken)) return;

    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    let cancelled = false;

    void (async () => {
      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.setSession({
            access_token: accessToken as string,
            refresh_token: refreshToken as string,
          });
      if (cancelled) return;

      const target = result.error
        ? "/login?error=link-invalid"
        : type === "recovery"
          ? "/reset-password"
          : "/app";
      window.location.replace(target);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
