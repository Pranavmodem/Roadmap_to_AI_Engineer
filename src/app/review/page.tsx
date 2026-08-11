"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { allDays, getDay } from "@/lib/curriculum";
import { useJourney } from "@/lib/store";
import { isDue, todayKey } from "@/lib/srs";
import { summarizeProgress } from "@/lib/progress";

/**
 * Spaced-repetition review. The deck = flashcards from every COMPLETED day,
 * scheduled SM-2-lite. Also surfaces quiz-driven revision recommendations.
 */
export default function ReviewPage() {
  const hydrated = useJourney((s) => s.hasHydrated);
  const completedDays = useJourney((s) => s.completedDays);
  const quizScores = useJourney((s) => s.quizScores);
  const startDate = useJourney((s) => s.startDate);
  const activityDates = useJourney((s) => s.activityDates);
  const srs = useJourney((s) => s.srs);
  const reviewCard = useJourney((s) => s.reviewCard);

  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(0);

  const today = todayKey();
  const due = useMemo(() => {
    if (!hydrated) return [];
    const done = new Set(completedDays);
    const out: { key: string; dayNum: number; f: string; b: string }[] = [];
    for (const d of allDays) {
      if (!done.has(d.id)) continue;
      d.flashcards.forEach((c, i) => {
        const key = `${d.id}:${i}`;
        if (isDue(srs[key], today)) out.push({ key, dayNum: d.day, f: c.f, b: c.b });
      });
    }
    // stable shuffle-ish: interleave by day so one day doesn't dominate
    return out.sort((a, b) => (a.dayNum % 7) - (b.dayNum % 7) || a.dayNum - b.dayNum);
  }, [hydrated, completedDays, srs, today]);

  const s = summarizeProgress(
    hydrated ? completedDays : [], hydrated ? quizScores : {}, hydrated ? startDate : null,
    hydrated ? activityDates : [], hydrated ? srs : {}
  );

  const current = due[0];

  const grade = (g: 0 | 1 | 2) => {
    if (!current) return;
    reviewCard(current.key, g);
    setFlipped(false);
    setSessionDone((n) => n + 1);
  };

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="kicker" style={{ marginBottom: "var(--space-2)" }}>spaced repetition — the review room</div>
      <h1 style={{ marginBottom: "var(--space-2)" }}>Review</h1>
      <p className="text-muted" style={{ maxWidth: "64ch", marginBottom: "var(--space-6)" }}>
        Cards from completed days come back right before you'd forget them: tomorrow, then in 3 days,
        then on a stretching schedule. "Again" resets a card; "Easy" stretches it further. Reviews count
        toward your streak.
      </p>

      {!hydrated ? (
        <p className="text-muted">Loading your deck…</p>
      ) : completedDays.length === 0 ? (
        <div className="blueprint" style={{ padding: "var(--space-6)" }}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <p style={{ margin: 0 }}>
            Your deck is empty because no days are complete yet. Finish{" "}
            <Link href="/day/d001">Day 1</Link> and its flashcards will appear here tomorrow.
          </p>
        </div>
      ) : current ? (
        <section aria-label="Flashcard review">
          <div className="text-muted mono" style={{ fontSize: 12, marginBottom: "var(--space-2)" }}>
            {due.length} due · {sessionDone} done this session
          </div>
          <div
            className="blueprint"
            role="button"
            tabIndex={0}
            aria-label={flipped ? "Card back — grade yourself" : "Card front — click to reveal"}
            onClick={() => setFlipped(!flipped)}
            onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped(!flipped); } }}
            style={{ padding: "var(--space-8)", minHeight: 210, display: "flex", flexDirection: "column", justifyContent: "center", cursor: "pointer", background: "var(--color-surface)" }}
          >
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
            <div className="kicker" style={{ marginBottom: 10 }}>
              {flipped ? "answer" : "prompt"} · from day {current.dayNum}
            </div>
            <p style={{ fontSize: flipped ? 16 : 19, fontWeight: flipped ? 400 : 500, lineHeight: 1.55, margin: 0 }}>
              {flipped ? current.b : current.f}
            </p>
            {!flipped && <p className="text-muted" style={{ fontSize: 12, marginTop: 14, marginBottom: 0 }}>click or press space to reveal</p>}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: "var(--space-4)", flexWrap: "wrap" }}>
            {flipped ? (
              <>
                <button className="btn btn-secondary" onClick={() => grade(0)} style={{ flex: 1 }}>✗ Again <span className="text-muted mono" style={{ fontSize: 10 }}>(tomorrow)</span></button>
                <button className="btn btn-primary" onClick={() => grade(1)} style={{ flex: 1 }}>✓ Got it</button>
                <button className="btn btn-secondary" onClick={() => grade(2)} style={{ flex: 1 }}>⚡ Easy <span className="text-muted mono" style={{ fontSize: 10 }}>(stretch)</span></button>
              </>
            ) : (
              <>
                <Link href={`/day/d${String(current.dayNum).padStart(3, "0")}`} className="btn btn-ghost" style={{ fontSize: 12 }}>
                  open day {current.dayNum} ↗
                </Link>
                <button className="btn btn-primary" onClick={() => setFlipped(true)} style={{ marginLeft: "auto" }}>Reveal</button>
              </>
            )}
          </div>
        </section>
      ) : (
        <div className="blueprint" style={{ padding: "var(--space-6)" }}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <p style={{ margin: 0 }}>
            🎉 Deck clear — {sessionDone > 0 ? `${sessionDone} cards reviewed. ` : ""}nothing due today.
            Come back tomorrow, or <Link href="/today">continue to today's lesson</Link>.
          </p>
        </div>
      )}

      {s.revisions.length > 0 && (
        <section style={{ marginTop: "var(--space-8)" }}>
          <h3 style={{ marginBottom: "var(--space-3)" }}>Targeted revision — where your quizzes struggled</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {s.revisions.map((r) => (
              <Link key={r.day.id} href={`/day/${r.day.id}`} className="zh-row" style={{ display: "flex", gap: 10, padding: "6px 8px", textDecoration: "none", color: "inherit", fontSize: 13.5, border: "1px solid color-mix(in srgb, var(--color-divider) 60%, transparent)" }}>
                <span className="mono tag tag-outline" style={{ fontSize: 10 }}>D{r.day.day}</span>
                <span style={{ fontWeight: 500 }}>{r.day.title}</span>
                <span className="text-muted" style={{ fontSize: 12.5 }}>— {r.reason}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* per-week re-quiz shortcuts */}
      <section style={{ marginTop: "var(--space-8)" }}>
        <h3 style={{ marginBottom: "var(--space-3)" }}>Weekly checkpoints</h3>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: "var(--space-3)" }}>
          Every review day carries a cumulative re-quiz over its week. Jump back into any checkpoint:
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {allDays.filter((d) => d.kind === "review").map((d) => (
            <Link key={d.id} href={`/day/${d.id}`} className="tag tag-neutral" style={{ textDecoration: "none", fontSize: 11 }} title={d.title}>
              D{d.day} · w{d.week}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
