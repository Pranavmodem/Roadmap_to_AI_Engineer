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

  // Pull + merge once per signed-in identity, then IMMEDIATELY push the merged
  // result — this is what saves progress made as a guest the moment someone
  // signs up or logs in, even if they close the tab right after.
  useEffect(() => {
    if (!hydrated || !authReady || !authUser || pulledFor.current === authUser.id) return;
    pulledFor.current = authUser.id;
    pushesToSkip.current += 1; // the merge itself shouldn't trigger a second push
    const userId = authUser.id;
    fetchUserState(userId).then((remote) => {
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
      // Read the post-merge store directly (state updates are synchronous in
      // zustand) and persist the union — or, for a brand-new account, the
      // guest's local progress — to the server right now.
      const s = useJourney.getState();
      const state: SyncedState = {
        completedDays: s.completedDays,
        quizScores: s.quizScores,
        srs: s.srs,
        notes: s.notes,
        bookmarks: s.bookmarks,
        snippets: s.snippets,
        projectChecks: s.projectChecks,
        activityDates: s.activityDates,
        startDate: s.startDate,
        mode: s.mode,
      };
      pushUserState(userId, state);
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

  // Flush on tab hide/close so the debounce window can't drop the last action.
  useEffect(() => {
    if (!authUser) return;
    const userId = authUser.id;
    const flush = () => {
      if (document.visibilityState !== "hidden") return;
      const s = useJourney.getState();
      pushUserState(userId, {
        completedDays: s.completedDays,
        quizScores: s.quizScores,
        srs: s.srs,
        notes: s.notes,
        bookmarks: s.bookmarks,
        snippets: s.snippets,
        projectChecks: s.projectChecks,
        activityDates: s.activityDates,
        startDate: s.startDate,
        mode: s.mode,
      });
    };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [authUser]);

  return <>{children}</>;
}
