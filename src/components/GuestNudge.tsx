"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useJourney } from "@/lib/store";
import { authEnabled } from "@/lib/supabase";

const DISMISS_KEY = "guest-nudge-dismissed"; // sessionStorage: returns next visit

/**
 * Signup nudge shown to guests on lesson pages. Appears a few seconds into a
 * lesson (once per browser session unless dismissed), and ALWAYS reappears the
 * moment a guest completes a day or passes a quiz — the exact moments their
 * progress becomes worth protecting. All progress made as a guest merges into
 * the account on signup, and the copy says so.
 */
export default function GuestNudge() {
  const authUser = useJourney((s) => s.authUser);
  const authReady = useJourney((s) => s.authReady);
  const hydrated = useJourney((s) => s.hasHydrated);
  const completedDays = useJourney((s) => s.completedDays);
  const quizScores = useJourney((s) => s.quizScores);
  const [open, setOpen] = useState(false);
  const [milestone, setMilestone] = useState(false);
  const baseline = useRef<{ days: number; quizzes: number } | null>(null);

  const isGuest = authEnabled && authReady && !authUser;
  const progressCount = completedDays.length + Object.keys(quizScores).length;

  // Timed nudge: a few seconds into the lesson, unless dismissed this session.
  useEffect(() => {
    if (!isGuest || !hydrated) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY)) return;
    const t = setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(t);
  }, [isGuest, hydrated]);

  // Milestone nudge: guest just completed a day or recorded a quiz — always pops,
  // even if the timed nudge was dismissed.
  useEffect(() => {
    if (!isGuest || !hydrated) return;
    const now = { days: completedDays.length, quizzes: Object.keys(quizScores).length };
    if (baseline.current == null) {
      baseline.current = now;
      return;
    }
    if (now.days > baseline.current.days || now.quizzes > baseline.current.quizzes) {
      baseline.current = now;
      setMilestone(true);
      setOpen(true);
    }
  }, [isGuest, hydrated, completedDays.length, quizScores]);

  if (!isGuest || !open) return null;

  const dismiss = () => {
    setOpen(false);
    setMilestone(false);
    if (typeof window !== "undefined") sessionStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <div
      className="blueprint"
      role="dialog"
      aria-label="Save your progress"
      style={{
        position: "fixed", bottom: 22, left: 22, zIndex: 40,
        width: "min(92vw, 360px)", background: "var(--color-bg)",
        boxShadow: "var(--shadow-lg)", padding: "var(--space-4)",
      }}
    >
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span className="kicker">{milestone ? "nice work — don't lose it" : "save your progress"}</span>
        <button
          className="btn btn-ghost"
          onClick={dismiss}
          aria-label="Dismiss"
          style={{ marginLeft: "auto", fontSize: 12, padding: "0 6px" }}
        >
          ✕
        </button>
      </div>
      <p style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: "var(--space-3)" }}>
        {milestone ? (
          <>That progress is saved <b>only in this browser</b>. A free account keeps your {progressCount > 0 ? <><b>{completedDays.length} completed day{completedDays.length === 1 ? "" : "s"}</b>{Object.keys(quizScores).length > 0 && <> and quiz scores</>}</> : "streak, mastery and flashcards"} safe and synced across devices — everything you've done here <b>carries over automatically</b> when you sign up.</>
        ) : (
          <>You're learning as a guest — progress lives only in this browser. A free account syncs your days, quiz mastery, flashcards and notes across devices, and <b>everything you've already done here carries over</b>.</>
        )}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <Link href="/signup" className="btn btn-primary" style={{ flex: 1 }}>Create free account</Link>
        <Link href="/login" className="btn btn-secondary">Log in</Link>
      </div>
    </div>
  );
}
