"use client";

import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { useJourney } from "@/lib/store";
import { getSupabase, fetchProfile } from "@/lib/supabase";

/** Bridges Supabase auth state into the zustand store. */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useJourney((s) => s.setAuth);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setAuth(null); // local-only mode: authReady=true, no user, no auth UI
      return;
    }
    let cancelled = false;

    const apply = async (session: Session | null) => {
      if (!session?.user) {
        if (!cancelled) setAuth(null);
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (!cancelled) {
        setAuth({
          id: session.user.id,
          email: session.user.email ?? "",
          username:
            profile?.username ??
            (session.user.user_metadata?.username as string | undefined) ??
            null,
        });
      }
    };

    sb.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      apply(session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [setAuth]);

  return <>{children}</>;
}
