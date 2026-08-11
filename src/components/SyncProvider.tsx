"use client";

import { useEffect, useRef } from "react";
import { useJourney } from "@/lib/store";
import { fetchUserState, pushUserState, SyncedState } from "@/lib/supabase";
import type { QuizResult, Snippet } from "@/lib/store";
import type { CardState } from "@/lib/srs";

/**
 * Keeps learner state in sync with Supabase for signed-in users (one JSONB
 * row per user in `user_progress`, RLS: own row only). Guests are local-only —
 * zustand persists to localStorage, and on first login local state is merged
 * (union) into the account row, so guest progress carries over.
 */
export default function SyncProvider({ children }: { children: React.ReactNode }) {
  const mergeRemote = useJourney((s) => s.mergeRemote);
  const authUser = useJourney((s) => s.authUser);
  const authReady = useJourney((s) => s.authReady);
  const hydrated = useJourney((s) => s.hasHydrated);
  const completedDays = useJourney((s) => s.completedDays);
  const quizScores = useJourney((s) => s.quizScores);
  const srs = useJourney((s) => s.srs);
  const notes = useJourney((s) => s.notes);
  const bookmarks = useJourney((s) => s.bookmarks);
  const snippets = useJourney((s) => s.snippets);
  const projectChecks = useJourney((s) => s.projectChecks);
  const activityDates = useJourney((s) => s.activityDates);
  const startDate = useJourney((s) => s.startDate);
  const mode = useJourney((s) => s.mode);
  const pulledFor = useRef<string | null>(null);
  const pushesToSkip = useRef(1);

  // Pull + merge once per signed-in identity
  useEffect(() => {
    if (!hydrated || !authReady || !authUser || pulledFor.current === authUser.id) return;
    pulledFor.current = authUser.id;
    pushesToSkip.current += 1; // the merge itself shouldn't trigger a push loop
    fetchUserState(authUser.id).then((remote) => {
      if (remote) {
        mergeRemote({
          completedDays: remote.completedDays ?? [],
          quizScores: (remote.quizScores as Record<string, QuizResult>) ?? {},
          srs: (remote.srs as Record<string, CardState>) ?? {},
          notes: remote.notes ?? {},
          bookmarks: remote.bookmarks ?? [],
          snippets: (remote.snippets as Snippet[]) ?? [],
          projectChecks: remote.projectChecks ?? {},
          activityDates: remote.activityDates ?? [],
          startDate: remote.startDate ?? null,
        });
      }
    });
  }, [hydrated, authReady, authUser, mergeRemote]);

  // Debounced push on change (signed-in only)
  useEffect(() => {
    if (!hydrated || !authReady || !authUser) return;
    if (pushesToSkip.current > 0) {
      pushesToSkip.current -= 1;
      return;
    }
    const t = setTimeout(() => {
      const state: SyncedState = {
        completedDays, quizScores, srs, notes, bookmarks, snippets,
        projectChecks, activityDates, startDate, mode,
      };
      pushUserState(authUser.id, state);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, authReady, authUser?.id, completedDays, quizScores, srs, notes, bookmarks, snippets, projectChecks, activityDates, startDate, mode]);

  return <>{children}</>;
}
