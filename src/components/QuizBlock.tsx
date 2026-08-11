"use client";

import { useState } from "react";
import Link from "next/link";
import { Day, dayId, getDayByNumber } from "@/lib/curriculum";
import { useJourney } from "@/lib/store";

/**
 * The day's knowledge check. All questions answered → submit → score recorded
 * to the store (latest attempt counts toward mastery). Missed questions show
 * their explanation and link to the exact day to revisit.
 */
export default function QuizBlock({ day }: { day: Day }) {
  const [picks, setPicks] = useState<(number | null)[]>(day.quiz.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const recordQuiz = useJourney((s) => s.recordQuiz);
  const prior = useJourney((s) => s.quizScores[day.id]);

  const allAnswered = picks.every((p) => p != null);
  const correct = picks.filter((p, i) => p === day.quiz[i].x).length;

  const submit = () => {
    if (!allAnswered) return;
    const missed = Array.from(
      new Set(
        day.quiz
          .map((q, i) => (picks[i] === q.x ? null : q.revisit ?? day.day))
          .filter((d): d is number => d != null)
      )
    );
    recordQuiz(day.id, { correct, total: day.quiz.length, missed, ts: new Date().toISOString() });
    setSubmitted(true);
  };

  const retake = () => {
    setPicks(day.quiz.map(() => null));
    setSubmitted(false);
  };

  return (
    <section className="blueprint" style={{ padding: "var(--space-6)" }} aria-label="Knowledge check">
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: "var(--space-4)" }}>
        <div className="kicker">Knowledge check</div>
        {prior && !submitted && (
          <span className="text-muted" style={{ fontSize: 12 }}>
            last attempt: {prior.correct}/{prior.total}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        {day.quiz.map((q, qi) => {
          const pick = picks[qi];
          return (
            <div key={qi}>
              <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
                <span className="mono text-muted" style={{ fontSize: 11 }}>Q{qi + 1}.</span> {q.q}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 620 }}>
                {q.o.map((o, oi) => {
                  const picked = pick === oi;
                  const isRight = oi === q.x;
                  return (
                    <button
                      key={oi}
                      className="btn btn-secondary"
                      disabled={submitted}
                      onClick={() => setPicks(picks.map((p, i) => (i === qi ? oi : p)))}
                      style={{
                        justifyContent: "flex-start", textAlign: "left", fontFamily: "var(--font-body)", fontWeight: 400,
                        borderColor: submitted && isRight ? "var(--color-accent)" : picked ? "var(--color-accent-600)" : undefined,
                        borderWidth: picked || (submitted && isRight) ? 2 : 1,
                        background:
                          submitted && isRight ? "color-mix(in srgb, var(--color-accent) 14%, transparent)"
                          : picked && !submitted ? "color-mix(in srgb, var(--color-accent) 7%, transparent)"
                          : undefined,
                        opacity: submitted && !isRight && !picked ? 0.6 : 1,
                      }}
                    >
                      <span className="mono" style={{ fontSize: 11, opacity: 0.6 }}>{String.fromCharCode(65 + oi)}</span>
                      <span style={{ flex: 1 }}>{o}</span>
                      {submitted && isRight && <span>✓</span>}
                      {submitted && picked && !isRight && <span>✗</span>}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div style={{ marginTop: 8, fontSize: 13.5 }} className={pick === q.x ? "text-muted" : ""}>
                  {pick === q.x ? "Correct. " : "Not quite. "}
                  {q.w}
                  {pick !== q.x && q.revisit != null && getDayByNumber(q.revisit) && (
                    <>
                      {" "}
                      <Link href={`/day/${dayId(q.revisit)}`} style={{ fontWeight: 500 }}>
                        → revisit Day {q.revisit}: {getDayByNumber(q.revisit)!.title}
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "var(--space-6)", display: "flex", alignItems: "center", gap: 12 }}>
        {!submitted ? (
          <button className="btn btn-primary" onClick={submit} disabled={!allAnswered}>
            {allAnswered ? "Submit answers" : `Answer all ${day.quiz.length} questions`}
          </button>
        ) : (
          <>
            <span className="tag tag-outline" style={{ fontSize: 13 }}>
              {correct}/{day.quiz.length} {correct === day.quiz.length ? "— perfect (+15 XP)" : correct >= 2 ? "— passed" : "— revisit recommended"}
            </span>
            <button className="btn btn-secondary" onClick={retake}>Retake</button>
          </>
        )}
      </div>
    </section>
  );
}
